from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from shapely import wkt
from shapely.geometry import Point
from pydantic import BaseModel, Field
from typing import List

app = FastAPI()

# Permite solicitudes CORS desde todos los dominios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el archivo CSV en un DataFrame global
df = pd.read_csv('csv2.csv')

# Convertir la columna 'the_geom' en objetos Point
df['the_geom'] = df['the_geom'].apply(wkt.loads)

class BeatPolygon(BaseModel):
    beat_id: int

class BeatLocation(BaseModel):
    latitud: float
    longitud: float

class CrimeData(BaseModel):
    crimePoints: List[List[float]]

@app.get('/get_beat_polygon')
def get_ward_polygon(beat_id: int = Query(...)):
    fila = df[df['BEAT_NUM'] == beat_id]
    if not fila.empty:
        return fila.iloc[0]['the_geom'].__geo_interface__
    else:
        raise HTTPException(status_code=404, detail=f'No se encontró ningún polígono para el Ward con ID {beat_id}.')

@app.post('/get_beat_location')
def get_beat_location(data: BeatLocation = Body(...)):
    lat = data.latitud
    lon = data.longitud

    punto = Point(lon, lat)
    for index, row in df.iterrows():
        if punto.within(row['the_geom']):  
            return {'BEAT_NUM': row['BEAT_NUM']}

    raise HTTPException(status_code=404, detail='No se encontró ningún polígono para las coordenadas proporcionadas.')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, debug=True)
