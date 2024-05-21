from fastapi import FastAPI, HTTPException
import os
import datetime
from joblib import load
import numpy as np


app = FastAPI()


@app.get("/crimes_for_route")
def get_crimes_for_route():

    date =  datetime.datetime.now()
    day_week = date.weekday()

    path = f".\models\model_knn_dayWeek{day_week+1}.pkl"
    print(path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Model file not found")

    try:
        model = load(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {e}")
    
    coordenadas = []
    archivo_txt = "coordenadas.txt"
    with open(archivo_txt, 'r') as archivo:
        lineas = archivo.readlines()
        for linea in lineas:
            latitud, longitud = map(float, linea.strip().split(','))
            coordenadas.append((latitud, longitud))

    print("Coordenadas originales:")
    print(coordenadas)
    new_coordenadas = []
    for coordenada in coordenadas:
        c = np.array([coordenada[1], coordenada[0]]).reshape(1, -1)
        new_coordenadas.append(c)

    print("Nuevas coordenadas:")
    print(new_coordenadas)
    return {"new_coordinates": new_coordenadas}    





