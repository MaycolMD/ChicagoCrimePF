from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import datetime
from joblib import load
import numpy as np
from pydantic import BaseModel


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

@app.post("/crimes_for_route")
def get_crimes_for_route(crime_data: CrimeData):
    print(crime_data)
    date =  datetime.datetime.now()
    day_week = date.weekday()

    path = f"./models/model_knn_dayWeek{day_week+1}.pkl"
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
        0: 'CONTRA EL SEXO',
        1:'CONTRA LA PERSONA',
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
    

      







