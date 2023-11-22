/*$.ajax({
    url: "http://localhost:4000/graficas",
    type: "GET",
    success: function (data) {

      const temperaturaData = {{temperaturaN}};
      const alturaData = {{alturaN}};
      const pesoData = {{pesoN}};

      // Llama a la función para crear el gráfico pasando los datos como argumento
      setTimeout(actualizarDatos, 5000); // 5000 milisegundos = 5 segundos
      createChart(data);
    },
    error: function (xhr, status, error) {
      console.log("Error al obtener los datos:", error);
    },
    // Inicia el proceso de actualización de datos al cargar la página
$(document).ready(function () {
  actualizarDatos();
});*/