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

    });
}



function enviarFormulario() {
    // Punto inicial A
    //Create the GeoJSON objects which represent the start and end points of the route.


    datasource.clear();

    // Agregar los puntos
    //Add the data to the data source.
    datasource.add([startPoint]);


    // Query Beat
    // Solicitar el MultiPolygon del Ward desde el endpoint Flask
    // Realiza la solicitud HTTP POST al endpoint del servidor

    // Realiza la solicitud HTTP POST al endpoint del servidor
    var data = {
        lat: startPoint.geometry.coordinates[1],
        long: startPoint.geometry.coordinates[0]
    };

    console.log(data)

    fetch('http://localhost:8001/crimes_for_point', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            // Puntos de crímen
            // Add your crime points here.
            var crimePoints = data.neighbors
            // Iterate over the crime points and add them to the data source.
            crimePoints.forEach(function (crimePoint) {
                var feature = new atlas.data.Feature(new atlas.data.Point([Math.floor(crimePoint[1] * 1000) / 1000, Math.floor(crimePoint[0] * 1000) / 1000]), {
                    title: crimePoint[2],
                    probability: crimePoint[3],
                    icon: "pin-round-red" // Icono para indicar puntos de interés
                });
                datasource.add(feature);

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
        });

}