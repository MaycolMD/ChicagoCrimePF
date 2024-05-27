# Usar una imagen base de Node.js
FROM node:14

# Instalar http-server globalmente
RUN npm install -g http-server

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar todos los archivos de la aplicación en el contenedor
COPY . .

# Exponer el puerto que usará http-server
EXPOSE 8000

# Comando para ejecutar http-server
CMD ["http-server", "-p", "8000"]
