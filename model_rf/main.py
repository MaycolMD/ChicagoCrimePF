from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from joblib import load
import datetime
import numpy as np
from pydantic import BaseModel
import requests

app = FastAPI()



# Permite solicitudes CORS desde todos los dominios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CrimeData(BaseModel):
    crimePoints: list[list]

# Cargar el modelo al iniciar la aplicación
@app.on_event("startup")
def load_model():
    global modelo
    try:
        modelo = load('./model/modelo_rf.pkl')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {e}")

@app.post("/prob_crime_in_route")
def get_prob_for_beats(crime_data: CrimeData):
    print(crime_data)
    date =  datetime.datetime.now()
    day_week = date.weekday() + 1
    time_category = date.hour//4 + 1

    if modelo is None:
        raise HTTPException(status_code=500, detail="model is not loaded")
    
    coordenadas = []
    # Extrae los datos del modelo
    coordenadas = crime_data.crimePoints

    print("Coordenadas originales:")
    print(coordenadas)
    new_coordenadas = []
    for coordenada in coordenadas:
        c = np.array([coordenada[0], coordenada[1]]).reshape(1, -1)
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

    #obtener los diferentes beats de la ruta
    beats = []
    info = []
    try:
        for cords in coordenadas:
            print(cords)
            beat_temporal = requests.post('http://localhost:5000/get_beat_location', json={"beat_locations":[cords]})
            beat_temporal_json = beat_temporal.json()
            if(beat_temporal_json['BEAT_NUM'] not in beats):
                beats.append(beat_temporal_json['BEAT_NUM'])
        print(beats)
        for Beat in beats:
            entradas = np.array([Beat,day_week,time_category]).reshape(1,-1)
            prediction = modelo.predict(entradas)
            crimen = crime_mapping[prediction.item()]
            proba = modelo.predict_proba(entradas)
            p = proba[0][prediction].item()
            info.append([Beat,crimen,p])
        print(info)
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Sufriendo: {e}")
    


#

    

    


    
        



