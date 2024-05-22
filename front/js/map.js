var map, datasource, client;

var endPoint, startPoint;

var geocodeServiceUrlTemplate = 'https://{azMapsDomain}/search/{searchType}/json?typeahead=true&api-version=1.0&query={query}&language={language}&lon={lon}&lat={lat}&countrySet={countrySet}&view=Auto';

// Acceder a la cuenta de Azure para usar Azure Maps
function GetMap() {
    //Instantiate a map object
    map = new atlas.Map('myMap', {
        view: 'Auto',
        // Replace <Your Azure Maps Key> with your Azure Maps subscription key. https://aka.ms/am-primaryKey
        authOptions: {
            authType: 'subscriptionKey',
            subscriptionKey: ''
        }
    });

    // Inicialización de todo lo que va a hacer el Map
    //Wait until the map resources are ready.
    map.events.add('ready', function () {

        // Add Traffic Flow to the Map
        // map.setTraffic({
        //     flow: "relative"
        // });
        //Create a data source and add it to the map.
        // La data fuente es el mapa
        datasource = new atlas.source.DataSource();
        map.sources.add(datasource);

        // Así se verán las líneas
        //Add a layer for rendering the route lines and have it render under the map labels.
        map.layers.add(new atlas.layer.LineLayer(datasource, null, {
            strokeColor: ['get', 'strokeColor'],
            strokeWidth: 5,
            lineJoin: 'round',
            lineCap: 'round'
        }), 'labels');

        //Renderizar puntos o juntarlos en multipuntos
        //Add a layer for rendering point data.
        map.layers.add(new atlas.layer.SymbolLayer(datasource, null, {
            iconOptions: {
                image: ['get', 'icon'],
                allowOverlap: true
            },
            textOptions: {
                textField: ['get', 'title'],
                offset: [0, 1.2]
            },
            filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']] //Only render Point or MultiPoints in this layer.
        }));

        // Punto inicial A
        //Create the GeoJSON objects which represent the start and end points of the route.
        var initialPoint = new atlas.data.Feature(new atlas.data.Point([-87.6667239, 42.0086426]), {
            title: "Rogers Park",
            icon: "pin-blue"
        });

        // punto final B
        var finalPoint = new atlas.data.Feature(new atlas.data.Point([-87.8106004, 41.8871291]), {
            title: "Oak Park",
            icon: "pin-red"
        });

        // Definir dónde va a estar la cámara inicial (entre punto A y punto B en este caso)
        map.setCamera({
            bounds: atlas.data.BoundingBox.fromData([initialPoint, finalPoint]),
            padding: 150,
        });

        //Create a jQuery autocomplete UI widget.
        $("#queryTbxInicio").autocomplete({
            minLength: 3,   //Don't ask for suggestions until atleast 3 characters have been typed. This will reduce costs by not making requests that will likely not have much relevance.
            source: function (request, response) {
                var center = map.getCamera().center;

                var countryIso = 'US';

                //Create a URL to the Azure Maps search service to perform the search.
                var requestUrl = geocodeServiceUrlTemplate.replace('{query}', encodeURIComponent(request.term))
                    .replace('{searchType}', 'poi')
                    .replace('{language}', 'en-US')
                    .replace('{lon}', center[0])    //Use a lat and lon value of the center the map to bais the results to the current map view.
                    .replace('{lat}', center[1])
                    .replace('{countrySet}', countryIso); //A comma seperated string of country codes to limit the suggestions to.

                processRequest(requestUrl).then(data => {
                    response(data.results);
                });
            },
            select: function (event, ui) {
                event.preventDefault(); // Evitar que se restablezca el valor del campo

                //Remove any previous added data from the map.
                datasource.clear();

                // punto inicial A
                startPoint = new atlas.data.Feature(new atlas.data.Point([ui.item.position.lon, ui.item.position.lat]), {
                    title: ui.item.poi.name,
                    icon: "pin-blue",
                    probability: 0,
                });

                console.log(ui.item)

                if (endPoint) {
                    datasource.add(endPoint);
                }

                datasource.add(startPoint);
                //Zoom the map into the selected location.
                map.setCamera({
                    bounds: [
                        ui.item.viewport.topLeftPoint.lon, ui.item.viewport.btmRightPoint.lat,
                        ui.item.viewport.btmRightPoint.lon, ui.item.viewport.topLeftPoint.lat
                    ],
                    padding: 400
                });

                // Update the input field with the full selected value
                $(this).val(ui.item.address.freeformAddress);

                return false;
            }
        }).autocomplete("instance")._renderItem = function (ul, item) {
            //Format the displayed suggestion to show the formatted suggestion string.
            var suggestionLabel = item.address.freeformAddress;

            if (item.poi && item.poi.name) {
                suggestionLabel = item.poi.name + ' (' + suggestionLabel + ')';
            }

            return $("<li>")
                .append("<a>" + suggestionLabel + "</a>")
                .appendTo(ul);
        };

        //Create a jQuery autocomplete UI widget.
        $("#queryTbxFin").autocomplete({
            minLength: 3,   //Don't ask for suggestions until atleast 3 characters have been typed. This will reduce costs by not making requests that will likely not have much relevance.
            source: function (request, response) {
                var center = map.getCamera().center;

                var countryIso = 'US';

                console.log(encodeURIComponent(request.term))
                //Create a URL to the Azure Maps search service to perform the search.
                var requestUrl = geocodeServiceUrlTemplate.replace('{query}', encodeURIComponent(request.term))
                    .replace('{searchType}', 'poi')
                    .replace('{language}', 'en-US')
                    .replace('{lon}', center[0])    //Use a lat and lon value of the center the map to bais the results to the current map view.
                    .replace('{lat}', center[1])
                    .replace('{countrySet}', countryIso); //A comma seperated string of country codes to limit the suggestions to.

                processRequest(requestUrl).then(data => {
                    response(data.results);
                });
            },
            select: function (event, ui) {
                event.preventDefault(); // Evitar que se restablezca el valor del campo

                //Remove any previous added data from the map.
                datasource.clear();

                // punto final B
                endPoint = new atlas.data.Feature(new atlas.data.Point([ui.item.position.lon, ui.item.position.lat]), {
                    title: ui.item.poi.name,
                    icon: "pin-red",
                    probability: 0,
                });

                if (startPoint) {
                    datasource.add(startPoint);
                }

                datasource.add(endPoint);
                //Zoom the map into the selected location.
                map.setCamera({
                    bounds: [
                        ui.item.viewport.topLeftPoint.lon, ui.item.viewport.btmRightPoint.lat,
                        ui.item.viewport.btmRightPoint.lon, ui.item.viewport.topLeftPoint.lat
                    ],
                    padding: 400
                });

                // Update the input field with the full selected value
                $(this).val(ui.item.address.freeformAddress);

                return false; // Prevent the default behavior
            }
        }).autocomplete("instance")._renderItem = function (ul, item) {
            //Format the displayed suggestion to show the formatted suggestion string.
            var suggestionLabel = item.address.freeformAddress;

            if (item.poi && item.poi.name) {
                suggestionLabel = item.poi.name + ' (' + suggestionLabel + ')';
            }

            return $("<li>")
                .append("<a>" + suggestionLabel + "</a>")
                .appendTo(ul);
        };
    });
}



function enviarFormulario() {
    // Aquí puedes obtener los valores del formulario y realizar las acciones necesarias.
    var inicio = document.getElementById("queryTbxInicio").value;
    var fin = document.getElementById("queryTbxFin").value;
    var transporte = document.getElementById("transporte").value;
    console.log("Inicio:", inicio);
    console.log("Fin:", fin);
    console.log("Transporte:", transporte);

    // Punto inicial A
    //Create the GeoJSON objects which represent the start and end points of the route.

    console.log(endPoint)


    datasource.clear();

    // Agregar los puntos
    //Add the data to the data source.
    datasource.add([startPoint, endPoint]);

    // Definir dónde va a estar la cámara inicial (entre punto A y punto B en este caso)
    map.setCamera({
        bounds: atlas.data.BoundingBox.fromData([startPoint, endPoint]),
        padding: 150,
    });
    // Query Ward
    // Solicitar el MultiPolygon del Ward desde el endpoint Flask
    var wards = [['0111', 0.8],
    ['0112', 0.9],
    ['0113', 0.8]];  // Cambia esto según el Ward que desees obtener

    console.log(wards)
    //Create a popup but leave it closed so we can update it and display it later.
    popup = new atlas.Popup({
        position: [0, 0]
    });

    function getRandomPastelColor() {
        var alpha = 0.5;
        var pastelColors = [
            "rgba(119, 221, 119, " + alpha + ")", // Pastel Green
            "rgba(255, 105, 97, " + alpha + ")",  // Pastel Red
            "rgba(174, 198, 207, " + alpha + ")", // Pastel Blue
            "rgba(255, 179, 71, " + alpha + ")",  // Pastel Orange
            "rgba(253, 253, 150, " + alpha + ")"  // Pastel Yellow
            // Puedes agregar más colores pastel según sea necesario
        ];
        var randomIndex = Math.floor(Math.random() * pastelColors.length);
        return pastelColors[randomIndex];
    }

    wards.forEach(function (wardId) {
        fetch(`http://127.0.0.1:5000/get_beat_polygon?beat_id=${wardId[0]}`)
            .then(response => response.json())
            .then(data => {
                if (data.type === 'MultiPolygon') {
                    // Crear el objeto GeoJSON para el MultiPolygon
                    var multiPolygon = {
                        "type": "Feature",
                        "geometry": data,
                        "properties": {
                            "strokeColor": getRandomPastelColor(),  // Color del borde del polígono
                            "fillColor": getRandomPastelColor(), // Color de relleno del polígono
                            "ward": wardId[0],
                            "probability": wardId[1]
                        }
                    };

                    // Añadir el objeto GeoJSON a la fuente de datos.
                    datasource.add(multiPolygon);

                    var polygonLayer = new atlas.layer.PolygonLayer(datasource, null, {
                        filter: ['==', ['geometry-type'], 'Polygon'], // Renderizar solo los polígonos
                        fillColor: ['get', 'fillColor'],  // Utilizar el color de relleno definido en las propiedades
                        strokeColor: ['get', 'strokeColor'],  // Utilizar el color del borde definido en las propiedades
                        strokeWidth: 2
                    })
                    // Añadir una capa para renderizar el MultiPolygon.
                    map.layers.add(polygonLayer);

                    //Add a mouse move event to the polygon layer to show a popup with information.
                    map.events.add('mousemove', polygonLayer, function (e) {
                        if (e.shapes && e.shapes.length > 0) {
                            var properties = e.shapes[0].getProperties();

                            //Update the content of the popup.
                            popup.setOptions({
                                content: '<div style="padding:10px"><b> Beat: ' + properties.ward + '</b><br/>Probabilidad de crimen: ' + (properties.probability * 100).toFixed(2) + ' %</div>',
                                position: e.position
                            });

                            //Open the popup.
                            popup.open(map);
                        }
                    });

                    //Add a mouse leave event to the polygon layer to hide the popup.
                    map.events.add('mouseleave', polygonLayer, function (e) {
                        popup.close();
                    });
                } else {
                    console.error("Error: Datos de polígono no válidos");
                }
            })
            .catch(error => {
                console.error('Error al obtener los datos del polígono:', error);
            });
    })

    // Coordenadas Inicio : Coordenadas final
    var query = startPoint.geometry.coordinates[1] + "," +
        startPoint.geometry.coordinates[0] + ":" +
        endPoint.geometry.coordinates[1] + "," +
        endPoint.geometry.coordinates[0];

    // Llamado al query de la ruta
    var selectElement = document.getElementById("transporte");

    var travelMode = selectElement.value;

    var url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&query=${query}&maxAlternatives=3&travelMode=${travelMode}`;

    //Make a search route request
    fetch(url, {
        headers: {
            "Subscription-Key": map.authentication.getToken()
        }
    }).then((response) => response.json())
        .then((response) => {
            // Itera sobre las tres primeras rutas alternativas.
            // Rutas alternativas
            for (let i = 0; i < 3; i++) {
                var route = response.routes[i];
                var routeCoordinates = [];
                var acumProb = [];
                var probs = [];

                // Obtener las coordenadas de cada punto de la ruta
                route.legs.forEach((leg) => {
                    var legCoordinates = leg.points.map((point) => {
                        return [point.longitude, point.latitude];
                    });
                    routeCoordinates = routeCoordinates.concat(legCoordinates);
                });
                // Añade cada ruta alternativa a la fuente de datos con un color diferente.
                // Juntar todos los puntos con una sola línea
                // Juntar todos los puntos con una sola línea
                let feature = new atlas.data.Feature(new atlas.data.LineString(routeCoordinates), {
                    strokeColor: "#2272B9",
                    strokeWidth: 5,
                    ruta: i + 1
                });

                // Agregar el objeto al datasource
                datasource.add(feature, 0);

                // Realiza la solicitud HTTP POST al endpoint del servidor
                var data = {
                    crimePoints: routeCoordinates
                };

                fetch('http://localhost:8000/crimes_for_route', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Success:', data);
                        // Puntos de crímen
                        // Add your crime points here.
                        var crimePoints = data.info

                        // Iterate over the crime points and add them to the data source.
                        crimePoints.forEach(function (crimePoint) {
                            if (crimePoint[3] > 0.7) {
                                console.log(crimePoint[1], crimePoint[0])
                                var feature = new atlas.data.Feature(new atlas.data.Point([crimePoint[1], crimePoint[0]]), {
                                    title: crimePoint[2],
                                    probability: crimePoint[3],
                                    icon: "pin-round-red" // Icono para indicar puntos de interés
                                });
                                datasource.add([feature]);
                            }

                        });
                        // Add a layer for rendering point data with custom text template.
                        var symbolLayer = new atlas.layer.SymbolLayer(datasource, null, {
                            iconOptions: {
                                image: ['get', 'icon'],
                                allowOverlap: true
                            },
                            textOptions: {
                                textField: ['get', 'title'],
                                offset: [0, 1.2]
                            },
                            filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']] //Only render Point or MultiPoints in this layer.
                        });

                        // Almacena una referencia al popup abierto.
                        var currentPopup = new atlas.Popup({
                            position: [0, 0]
                        });

                        //Add a mouse move event to the polygon layer to show a popup with information.
                        map.events.add('mousemove', symbolLayer, function (e) {
                            if (e.shapes && e.shapes.length > 0) {
                                var properties = e.shapes[0].getProperties();

                                //Update the content of the popup.
                                currentPopup.setOptions({
                                    content: '<div style="padding:10px"><b>' + properties.title + '</b><br/>Probabilidad: ' + (properties.probability * 100).toFixed(2) + ' %</div>',
                                    position: e.position
                                });

                                //Open the currentPopup.
                                currentPopup.open(map);
                            }
                        });

                        //Add a mouse leave event to the polygon layer to hide the popup.
                        map.events.add('mouseleave', symbolLayer, function (e) {
                            currentPopup.close();
                        });

                        map.layers.add(symbolLayer);

                        function calcularPromedio(lista) {
                            // Verifica si la lista no está vacía
                            if (lista.length === 0) return 0;

                            // Suma todos los elementos de la lista
                            let suma = lista.reduce((acumulador, valorActual) => acumulador + valorActual, 0);

                            // Calcula el promedio dividiendo la suma por la cantidad de elementos
                            let promedio = suma / lista.length;

                            return promedio;
                        }

                        // Función para agregar tramos peligrosos a la capa de líneas.
                        function addDangerousSegments(dangerousSegments) {
                            var prom = calcularPromedio(acumProb);
                            // Itera sobre los tramos peligrosos.
                            dangerousSegments.forEach(function (segment) {
                                // Crea un conjunto de coordenadas para el tramo peligroso.
                                var coordinates = segment.map(function (point) {
                                    return [point[1], point[0]]; // Invierte latitud y longitud.
                                });

                                // Agrega el tramo peligroso a la fuente de datos como una línea.
                                datasource.add(new atlas.data.Feature(new atlas.data.LineString(coordinates), {
                                    strokeColor: '#FF0000', // Color rojo para los tramos peligrosos.
                                    strokeWidth: 5,
                                    ruta: i + 1,
                                    probability: prom
                                }));
                            });
                        }

                        // Función para agrupar puntos con una probabilidad mayor a 0.7.
                        function groupCrimePointsByProbability(crimePoints) {
                            var groupedSegments = [];
                            var currentSegment = [];

                            // Itera sobre los puntos de crimen.
                            for (var i = 0; i < crimePoints.length; i++) {

                                var currentPoint = crimePoints[i];
                                
                                acumProb.push(currentPoint[3]);

                                // Comprueba si la probabilidad del crimen es mayor a 0.7.
                                if (currentPoint[3] > 0.7) {
                                    // Agrega el punto actual al segmento actual.
                                    currentSegment.push([currentPoint[0], currentPoint[1]]);
                                } else {
                                    // Si hay puntos en el segmento actual, agrégalo al conjunto de segmentos agrupados.
                                    if (currentSegment.length > 0) {
                                        groupedSegments.push(currentSegment);
                                        currentSegment = []; // Inicializa un nuevo segmento.
                                    }
                                }
                            }

                            // Si hay puntos en el segmento actual, agrégalo al conjunto de segmentos agrupados.
                            if (currentSegment.length > 0) {
                                groupedSegments.push(currentSegment);
                            }

                            return groupedSegments;
                        }

                        // Agrupa los puntos de crimen por probabilidad mayor a 0.7.
                        var groupedSegments = groupCrimePointsByProbability(crimePoints);

                        var promProb = calcularPromedio(acumProb);
                        probs.push(promProb)

                        console.log(groupedSegments)
                        // Agrega los segmentos agrupados a la capa de datos.
                        addDangerousSegments(groupedSegments);

                        var LineLayer = new atlas.layer.LineLayer(datasource, null, {
                            filter: ['==', ['geometry-type'], 'LineString'], // Renderizar solo los polígonos
                            fillColor: ['get', 'fillColor'],  // Utilizar el color de relleno definido en las propiedades
                            strokeColor: ['get', 'strokeColor'],  // Utilizar el color del borde definido en las propiedades
                            strokeWidth: 5
                        })
                        // Añadir una capa para renderizar el MultiPolygon.
                        map.layers.add(LineLayer);

                        // Almacena una referencia al popup abierto.
                        var LinePopup = new atlas.Popup({
                            position: [0, 0]
                        });

                        //Add a mouse move event to the polygon layer to show a popup with information.
                        map.events.add('mousemove', LineLayer, function (e) {
                            if (e.shapes && e.shapes.length > 0) {
                                var properties = e.shapes[0].getProperties();

                                //Update the content of the popup.
                                console.log('featureprop '+ properties.probability)
                                LinePopup.setOptions({
                                    content: '<div style="padding:10px"><b> Ruta: ' + properties.ruta + '</b><br/>Seguridad de la ruta: ' + (100 - (probs[properties.ruta-1] * 100)).toFixed(2) + ' %</div>',
                                    position: e.position
                                });

                                //Open the popup.
                                LinePopup.open(map);
                            }
                        });

                        //Add a mouse leave event to the polygon layer to hide the popup.
                        map.events.add('mouseleave', LineLayer, function (e) {
                            LinePopup.close();
                        });

                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            }
        });

}