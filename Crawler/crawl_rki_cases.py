#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import numpy as np
import pandas as pd
import psycopg2 as pg
import datetime
import requests

print('Crawler for RKI detailed case data')

def get_connection():
    conn = pg.connect("host=db.dbvis.de dbname=coronadb user=corona password=***REMOVED***")
    cur = conn.cursor()
    return conn, cur


URL = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Meldedatum%20asc&resultOffset={}&resultRecordCount=2000&cacheHint=true"



print('Fetch data')
data = None
has_data = True
offset = 0
while has_data:
    r = requests.get(URL.format(offset))
    rj = r.json()
    if data is None:
        data = rj
    else:
        data['features'].extend(rj['features'])
        if len(rj['features']) == 0:
            has_data = False
    offset += 2000
    print(offset)
data = [d['attributes'] for d in data['features']]


print('Parse data')
entries = []
for el in data:
    cc = ['case' for i in range(el['AnzahlFall'])]
    cc.extend(['death' for i in range(el['AnzahlTodesfall'])])
    entry = [{
    'datenbestand': datetime.datetime.strptime(el['Datenstand'], '%d.%m.%Y %H:%M'),
    'idbundesland': el['IdBundesland'],
    'bundesland': el['Bundesland'],
    'landkreis': el['Landkreis'],
    'idlandkreis': el['IdLandkreis'],
    'objectid': el['ObjectId'],
    'meldedatum': datetime.datetime.utcfromtimestamp(el['Meldedatum'] / 1000),
    'gender': el['Geschlecht'],
    'agegroup': el['Altersgruppe'],
    'casetype': casetype
    } for casetype in cc]
    entries.extend(entry)


print('current cases', len(entries))


print('Insert into DB (takes 5-10min)...')
aquery = 'INSERT INTO cases(datenbestand, idbundesland, bundesland, landkreis, idlandkreis, objectid, meldedatum, gender, agegroup, casetype) VALUES(%(datenbestand)s, %(idbundesland)s, %(bundesland)s, %(landkreis)s, %(idlandkreis)s, %(objectid)s, %(meldedatum)s, %(gender)s, %(agegroup)s, %(casetype)s)'  
conn, cur = get_connection()
cur.executemany(aquery, entries)
conn.commit()

print('Success')




