import os
from google.cloud import bigquery
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, recall_score, precision_score
from sklearn.preprocessing import LabelEncoder
from sklearn import neighbors
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import time
import numpy as np
from google.oauth2 import service_account
from google.cloud import bigquery
import db_dtypes
import joblib

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] ='key.json'
client = bigquery.Client()
creds = service_account.Credentials.from_service_account_file('key.json')
client = bigquery.Client(credentials=creds, project='bq-proyecto-final')

sql = """

SELECT Latitude as x,	Longitude as y	, Primary_Type as delito, EXTRACT(HOUR FROM Date) as hour, EXTRACT(DAYOFWEEK FROM Date) as day_week,
CASE
        WHEN Primary_Type IN ('ROBBERY', 'THEFT', 'MOTOR VEHICLE THEFT', 'CRIMINAL DAMAGE', 'BURGLARY') THEN 'ROBOS'
        WHEN Primary_Type IN ('HOMICIDE', 'STALKING', 'KIDNAPPING', 'INTIMIDATION', 'WEAPONS VIOLATION', 'NARCOTICS', 'ASSAULT', 'BATTERY') THEN 'CONTRA LA PERSONA'
        WHEN Primary_Type IN ('CRIM SEXUAL ASSAULT', 'SEX OFFENSE', 'PUBLIC INDECENCY', 'CRIMINAL SEXUAL ASSAULT', 'OBSCENITY') THEN 'CONTRA EL SEXO'
        WHEN Primary_Type IN ('OFFENSE INVOLVING CHILDREN', 'HUMAN TRAFFICKING', 'DOMESTIC VIOLENCE', 'PROSTITUTION') THEN 'CRIMENES CONTRA MENORES Y VULNERABLES'
        WHEN Primary_Type IN ('GAMBLING', 'OTHER NARCOTIC VIOLATION') THEN 'CRIMENES RELACIONADOS CON DROGAS Y NARCOTICOS'
        WHEN Primary_Type IN ('ARSON', 'DECEPTIVE PRACTICE', 'RITUALISM', 'INTERFERENCE WITH PUBLIC OFFICER', 'CONCEALED CARRY LICENSE VIOLATION', 'OTHER OFFENSE', 'PUBLIC PEACE VIOLATION', 'LIQUOR LAW VIOLATION', 'CRIMINAL TRESPASS', 'NON - CRIMINAL', 'NON-CRIMINAL (SUBJECT SPECIFIED)', 'NON-CRIMINAL') THEN 'OTROS CRIMENES MENORES Y VIOLACIONES DE LA LEY'
        ELSE 'OTROS'
    END AS categoria
FROM `bq-proyecto-final.Datos_Fuente.Crimenes` as c
WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL AND Primary_Type IS NOT NULL AND
Primary_Type IN ('OFFENSE INVOLVING CHILDREN', 'ROBBERY', 'HOMICIDE', 'INTERFERENCE WITH PUBLIC OFFICER', 'ARSON', 'PUBLIC PEACE VIOLATION', 'STALKING', 'DOMESTIC VIOLENCE', 'GAMBLING', 'PROSTITUTION', 'THEFT', 'KIDNAPPING', 'INTIMIDATION', 'OTHER NARCOTIC VIOLATION', 'NARCOTICS', 'CRIM SEXUAL ASSAULT', 'PUBLIC INDECENCY', 'MOTOR VEHICLE THEFT', 'CRIMINAL DAMAGE', 'CRIMINAL TRESPASS', 'SEX OFFENSE', 'CRIMINAL SEXUAL ASSAULT', 'ASSAULT', 'OBSCENITY', 'HUMAN TRAFFICKING')
"""

df_data = client.query(sql).result().to_dataframe()

subdataframes = {}
for day, data in df_data.groupby('day_week'):
    subdataframes[day] = data.copy()


# REMEMBER CHANGE subdataframes[x] where x is day of the week you want to get. It is missing 3,4,5,6 and 7
datos_dayWeek = subdataframes[7]
df_data = datos_dayWeek


inputs = ['x','y']
output = ['categoria']

X = df_data[inputs]
y = df_data[output]


label_encoder = LabelEncoder()
Y_encoded = label_encoder.fit_transform(y)


X_train, X_test, y_train, y_test = train_test_split(X, Y_encoded, test_size=0.2, random_state=100)

clfKNN = neighbors.KNeighborsClassifier(n_neighbors=13, # número de vecinos
                                        weights='uniform', # pesos asignados a los vecinos al momento
                                                           # de tomar la decisión
                                                           # 'uniform', 'distance'
                                        algorithm='brute', # optimiza la ejecución del clasificador
                                                           # ‘auto’, ‘ball_tree’, ‘kd_tree’, ‘brute’
                                        #metric='braycurtis'
                                        metric='cityblock'
                                        )
clfKNN.fit(X_train,y_train)
y_expected = y_test
y_predicted = clfKNN.predict(X_test)

print(accuracy_score(y_expected,y_predicted))
print(confusion_matrix(y_expected,y_predicted))

joblib.dump(clfKNN, 'model_knn_dayWeek7.pkl')