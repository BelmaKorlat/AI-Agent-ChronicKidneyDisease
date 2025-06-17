import pandas as pd
import numpy as np

df = pd.read_csv('Backend/data/chronic_kidney_disease.csv')

# Sve “?” i “\t?” zamijenjene sa NaN
df.replace("?", np.nan, inplace=True)
df.replace("\t?", np.nan, inplace=True)

# Funkcija za čišćenje stringova: uklanja vodeće/trailing razmake i tabove
def clean_string(x):
    if isinstance(x, str):
        return x.strip().replace('\t', '').replace(' ', '')
    return x

# Primijena na sve kategorijske kolone gdje je bilo problema
for col in ['dm', 'cad', 'classification', 'pcv', 'wc', 'rc', 'htn', 'pe', 'ane', 'appet', 'rbc', 'pc', 'pcc', 'ba']:
    df[col] = df[col].apply(clean_string)

# Prisilno konvertovanje kolone u float, sve što ne može biti broj pretvara se u NaN
for col in ['pcv', 'wc', 'rc']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

df['classification'] = df['classification'].replace('ckd\t', 'ckd')

# 1. Definisanje liste numeričkih i kategorijskih kolona (osim 'id' i 'classification')
numericke_kolone = ['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc']
kategoricke_kolone = ['rbc', 'pc', 'pcc', 'ba', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane']

# 2. Kolone sa previše praznih vrijednosti (više od ili jednako 40%)
def previse_praznih(kolona):
    prazno = df[kolona].isnull().sum()
    ukupno = len(df)
    return (prazno / ukupno) >= 0.4

# 3. Liste kolona koje ce se imputirati ili izostaviti
num_za_imput = [col for col in numericke_kolone if not previse_praznih(col)]
num_za_izostaviti = [col for col in numericke_kolone if previse_praznih(col)]

cat_za_imput = [col for col in kategoricke_kolone if not previse_praznih(col)]
cat_za_izostaviti = [col for col in kategoricke_kolone if previse_praznih(col)]

print("Ukupno:", len(df))
print("Numeričke kolone koje će biti imputirane:", num_za_imput)
print("Numeričke kolone koje će biti izostavljene:", num_za_izostaviti)
print("Kategorijske kolone koje će biti imputirane:", cat_za_imput)
print("Kategorijske kolone koje će biti izostavljene:", cat_za_izostaviti)
print("--------------------------------------------------")

# 4. Imputacija numeričkih kolona (medijan) + winsorization outliera (opcija)
for col in num_za_imput:
    medijan = df[col].median()
    # Outlier handling: ograniči vrijednosti na (1.5*IQR) iznad Q3 i ispod Q1
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    min_val = Q1 - 1.5 * IQR
    max_val = Q3 + 1.5 * IQR
    df[col] = np.where(df[col] < min_val, min_val, df[col])
    df[col] = np.where(df[col] > max_val, max_val, df[col])
    df[col] = pd.Series(df[col]) 
    df[col] = df[col].fillna(medijan)

# 5. Imputacija kategorijskih kolona (mod, tj. najčešća vrijednost)
for col in cat_za_imput:
    mod = df[col].mode()[0]
    df[col] = df[col].fillna(mod)

# 6. (Ostavi prazne ili izbaci iz analize) – ove kolone samo preskoči prilikom modeliranja
print("Kolone koje NEĆEŠ koristiti u treniranju modela zbog previše praznih vrijednosti:", num_za_izostaviti + cat_za_izostaviti)
print("--------------------------------------------------")

# 7. Spremanje novog dataseta
df.to_csv('Backend/data/ckd_cleaned_imputed.csv', index=False)
