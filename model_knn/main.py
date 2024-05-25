from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import datetime
from joblib import load
import numpy as np
from pydantic import BaseModel
from geopy.distance import distance
from geopy.point import Point


app = FastAPI()

# Permite solicitudes CORS desde todos los dominios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define el modelo de datos esperado en la solicitud POST
class CrimeData(BaseModel):
    crimePoints: list[list]

class CrimePoint(BaseModel):
    lat: float
    long: float

class CrimePoint(BaseModel):
    lat: float
    long: float

def generate_circle_points(center_lat, center_lon, radius_km, num_points=100):
    center_point = Point(center_lat, center_lon)
    circle_points = []

    # Generar puntos en la circunferencia a intervalos regulares de ángulos
    for bearing in range(0, 360, int(360 / num_points)):
        destination = distance(kilometers=radius_km).destination(center_point, bearing)
        circle_points.append((destination.latitude, destination.longitude))

    return circle_points


@app.post("/crimes_for_point")
def get_crimes_for_point(point: CrimePoint):
    date = datetime.datetime.now()
    day_week = date.weekday()
    time = date.hour

    if time in [7, 8, 9, 10, 11, 12]:
        range_time = 'morning'
    elif time in [13, 14, 15, 16, 17, 18, 19]:
        range_time = 'afternoon'
    else:
        range_time = 'night'

    path = f"./models/day{day_week+1}/knn_day{day_week+1}_{range_time}.pkl"
    print(path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Model file not found")

    try:
        model = load(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {e}")

    try:
        circle_points = generate_circle_points(point.lat, point.long, radius_km=0.3, num_points=30)
        points = [np.array(p).reshape(1, -1) for p in circle_points]

        crime_mapping = {
            0: 'CRIMEN CONTRA EL SEXO',
            1: 'CRIMEN CONTRA LA PERSONA',
            2: 'CRIMENES CONTRA MENORES Y VULNERABLES',
            3: 'CRIMENES RELACIONADOS CON DROGAS Y NARCOTICOS',
            4: 'OTROS CRIMENES MENORES Y VIOLACIONES DE LA LEY',
            5: 'ROBOS'
        }

        info = []
        for c in points:
            i = []
            i.append(c[0][0])
            i.append(c[0][1])
            prediction = model.predict(c)
            crimen = crime_mapping[prediction.item()]
            i.append(crimen)

            proba = model.predict_proba(c)
            p = proba[0][prediction].item()
            i.append(p)

            info.append(i)

        return {"neighbors": info}

    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Sufriendo: {e}")

@app.post("/crimes_for_route")
def get_crimes_for_route(crime_data: CrimeData):
    print(crime_data)
    date =  datetime.datetime.now()
    day_week = date.weekday()
    time = date.hour

        
    if (time in [7,8,9,10,11,12]):
        range_time = 'morning'
    elif (time in [13,14,15,16,17,18,19]):
        range_time = 'afternoon'
    else:
        range_time = 'night'

    path = f"./models/day{day_week+1}/knn_day{day_week+1}_{range_time}.pkl"
    print(path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Model file not found")

    try:
        model = load(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {e}")
    
    coordenadas = []
    # Extrae los datos del modelo
    coordenadas = crime_data.crimePoints
    print(coordenadas)

    print("Coordenadas originales:")
    print(coordenadas)
    new_coordenadas = []
    for coordenada in coordenadas:
        c = np.array([coordenada[1], coordenada[0]]).reshape(1, -1)
        new_coordenadas.append(c)

    print("Nuevas coordenadas:")
    print(new_coordenadas)
    

    crime_mapping = {
        0: 'CRIMEN CONTRA EL SEXO',
        1:'CRIMEN CONTRA LA PERSONA',
        2: 'CRIMENES CONTRA MENORES Y VULNERABLES',
        3: 'CRIMENES RELACIONADOS CON DROGAS Y NARCOTICOS',
        4: 'OTROS CRIMENES MENORES Y VIOLACIONES DE LA LEY',
        5: 'ROBOS'
        }

    info = []
    try:
        for c in new_coordenadas:
            i = []
            i.append(c[0][0])
            i.append(c[0][1])
            prediction = model.predict(c)
            crimen = crime_mapping[prediction.item()]
            i.append(crimen)

            proba = model.predict_proba(c)
            p = proba[0][prediction].item()
            i.append(p)

            info.append(i)

        return {"info": info} 
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Sufriendo: {e}")