/*
$(document).ready(function () {
    // Función para actualizar los datos del sensor
    function updateSensorData() {
        $.ajax({
            // URL para obtener los datos del sensor desde el servidor
            url: '/sensor', 
            // Tipo de solicitud HTTP (en este caso, POST para obtener datos)
            type: 'POST', 
            // Tipo de datos esperados en la respuesta del servidor (JSON)
            dataType: 'json',
            success: function (data) {
                // Extrae el valor de altura de la respuesta del servidor
                var altura = data.Sensores[0].atributos.altura;

                console.log('Altura recibida desde el servidor:', altura); // Agrega este mensaje de depuración
            },
            error: function (error) {
                // Función ejecutada si hay un error en la solicitud
                console.error('Error al obtener datos del sensor:', error);
            }
        });
    }

    // Configura un intervalo para ejecutar la función de actualización cada 5 segundos
    setInterval(updateSensorData, 5000);

    // Ejecuta la función de actualización al cargar la página
    updateSensorData();
});*/
