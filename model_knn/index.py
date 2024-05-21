import os
import datetime
from joblib import load
import numpy as np

date =  datetime.datetime.now()
day_week = date.weekday()

path = f".\models\model_knn_dayWeek{day_week+1}.pkl"

print(path)
if os.path.exists(path):
    model = load(path)
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

    
else:
    print("Error")



