from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from shapely import wkt
from shapely.geometry import MultiPolygon
from shapely.geometry import MultiPolygon, Point
from pydantic import BaseModel

app = Flask(__name__)
CORS(app)  # Permitir todos los orígenes

# Cargar el archivo CSV en un DataFrame global
df = pd.read_csv('csv2.csv')

# Convertir la columna 'the_geom' en objetos MultiPolygon
df['the_geom'] = df['the_geom'].apply(wkt.loads)

@app.route('/get_beat_polygon', methods=['GET'])
def get_ward_polygon():
    # Obtener el ID del Ward desde los parámetros de la URL
    beat_id = request.args.get('beat_id', type=str)
    print(beat_id)
    
    if beat_id is None:
        return jsonify({'error': 'El parámetro beat_id es requerido.'}), 400
    
    # Definir una función para obtener el objeto poligonal (Multipolygon) de un Ward específico
    def obtener_poligono_por_ward(beat_id, df):
        # Filtrar el DataFrame para obtener la fila correspondiente al beat_id
        fila = df[df['BEAT_NUM'] == int(beat_id)]
        print(fila.iloc[0]['the_geom'].__geo_interface__)
        if not fila.empty:
            # Devolver el objeto poligonal (Multipolygon) en formato GeoJSON
            return fila.iloc[0]['the_geom'].__geo_interface__
        else:
            return None  # Si no se encuentra el Ward, devolver None o manejar el caso según sea necesario

    # Obtener el objeto poligonal (Multipolygon) del Ward deseado
    poligono_ward = obtener_poligono_por_ward(beat_id, df)

    if poligono_ward:
        return jsonify(poligono_ward)
    else:
        return jsonify({'error': f'No se encontró ningún polígono para el Ward con ID {beat_id}.'}), 404

@app.route('/get_beat_location', methods=['POST'])
def get_beat_location():
    data = request.get_json()

    lat = data['latitud']
    lon = data['longitud']

    def encontrar_area(lat, lon, df):
        punto = Point(lon, lat)
        for index, row in df.iterrows():
            if punto.within(row['the_geom']):  # Asegúrate de que 'geometry' sea el nombre correcto de la columna
                return row['BEAT_NUM']
        return 'No se encontró área'

    # Obtener el objeto poligonal (Multipolygon) del Ward deseado
    poligono_ward = encontrar_area(lat, lon, df)

    if poligono_ward:
        return jsonify({'BEAT_NUM': poligono_ward})
    else:
        return jsonify({'error': 'No se encontró ningún polígono para las coordenadas proporcionadas.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
