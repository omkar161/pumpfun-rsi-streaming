// This file is the entry point for the Rust microservice.
// It sets up the server, defines routes, and handles incoming requests related to the RSI functionality.

use actix_web::{web, App, HttpServer, Responder};

async fn index() -> impl Responder {
    "Welcome to the Rust RSI microservice!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}