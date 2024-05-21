from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from shapely import wkt
from shapely.geometry import MultiPolygon

app = Flask(__name__)
CORS(app)  # Permitir todos los orígenes

# Cargar el archivo CSV en un DataFrame global
df = pd.read_csv('csv.csv')

# Convertir la columna 'the_geom' en objetos MultiPolygon
df['the_geom'] = df['the_geom'].apply(wkt.loads)

@app.route('/get_ward_polygon', methods=['GET'])
def get_ward_polygon():
    # Obtener el ID del Ward desde los parámetros de la URL
    ward_id = request.args.get('ward_id', type=int)
    
    if ward_id is None:
        return jsonify({'error': 'El parámetro ward_id es requerido.'}), 400
    
    # Definir una función para obtener el objeto poligonal (Multipolygon) de un Ward específico
    def obtener_poligono_por_ward(ward_id, df):
        # Filtrar el DataFrame para obtener la fila correspondiente al ward_id
        fila = df[df['Ward'] == ward_id]
        if not fila.empty:
            # Devolver el objeto poligonal (Multipolygon) en formato GeoJSON
            return fila.iloc[0]['the_geom'].__geo_interface__
        else:
            return None  # Si no se encuentra el Ward, devolver None o manejar el caso según sea necesario

    # Obtener el objeto poligonal (Multipolygon) del Ward deseado
    poligono_ward = obtener_poligono_por_ward(ward_id, df)

    if poligono_ward:
        return jsonify(poligono_ward)
    else:
        return jsonify({'error': f'No se encontró ningún polígono para el Ward con ID {ward_id}.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
