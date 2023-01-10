//Requisitos
const express = require('express');
const fs = require('fs');
const { Server: HttpServer } = require('http');
const { Server: IOServer } = require('socket.io');
const ClienteSQL = require('./db/sqlContainer').ClienteSQL;
const optionsMariaDB = require('./options/mysqlconn').options;
const optionsSQLite = require('./options/sqlite3conn').options;


const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sqlProductos = new ClienteSQL(optionsMariaDB, "productos");
let sqlMensajes = new ClienteSQL(optionsSQLite, "mensajes");

sqlProductos.crearTablaProductos();
sqlMensajes.crearTablaMensajes();

//Ejs
app.set('view engine', 'ejs');

//Peticiones del servidor
app.get("/", (req, res) => {
    res.render("pages/index");
});

//Websocket
io.on('connection', function (socket) {
    console.log("Cliente conectado");

    sqlProductos = new ClienteSQL(optionsMariaDB, "productos");
    sqlProductos.obtenerProductos()
        .then(productos => socket.emit('productos', productos));

    sqlMensajes = new ClienteSQL(optionsSQLite, "mensajes");
    sqlMensajes.obtenerMensajes()
        .then(mensajes => io.sockets.emit('mensajes', mensajes));


    socket.on("nuevo-producto", producto => {
        sqlProductos = new ClienteSQL(optionsMariaDB, "productos");
        sqlProductos.insertarElemento(producto)
            .then(() => sqlProductos.obtenerProductos())
            .then(productos => socket.emit('productos', productos));
    });

    socket.on("nuevo-mensaje", message => {
        sqlMensajes = new ClienteSQL(optionsSQLite, "mensajes");
        sqlMensajes.insertarElemento(message)
            .then(() => sqlMensajes.obtenerMensajes())
            .then(mensajes => io.sockets.emit('mensajes', mensajes));
    })
});

//Escucha del servidor
httpServer.listen(8080, () => {
    console.log("Servidor escuchando en puerto 8080");
})
