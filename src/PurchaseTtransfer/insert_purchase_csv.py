from model import *
from setting import session
import itertools

#pandasを読み込む
import pandas as pd
import numpy as np

#from datetime 
import datetime
from decimal import *

#ドラックアンドドロップしたExcelブック名を取得
import sys
input_file = sys.argv[1:]
input_file_name = input_file[0]
#input_file_name = '仕入管理_2019年度7.8.xlsm'


with open(input_file) as f:
    l_strip = [s.strip() for s in f.readlines()]
    print(l_strip)
# ['line 1', 'line 2', 'line 3']


#チェック・登録判定
isCheck = False if len(sys.argv) >= 2 and sys.argv[2] == "1" else True

input_sheet_name = "仕入インポートシート"


#xls book Open (xls, xlsxのどちらでも可能)
book = pd.ExcelFile(input_file_name) 

#sheet_namesメソッドでExcelブック内の各シートの名前をリストで取得できる
sheet_name = book.sheet_names
keys = sheet_name
values = range(len(sheet_name))

dicSheet = dict(zip(keys, values))
#print(dicSheet)

colPurchase = [ key for key, value in Purchase.__dict__.items() if key[0:1] != '_' ]


#df = book.parse(sheet_name[1],
df = book.parse(sheet_name[dicSheet[input_sheet_name]],
                      header = 0,
                      skiprows = 0,
                      skip_footer = 0,
                      parse_cols = 21,
                      columns = ['年度'
                                ,'仕入先'
                                ,'入札NO'
                                ,'仕入日'
                                ,'品種'
                                ,'茶期'
                                ,'格付'
                                ,'茶種'
                                ,'品柄'
                                ,'圃場'
                                ,'生産者'
                                ,'単価'
                                ,'梱包重量'
                                ,'梱包本数'
                                ,'端数重量'
                                ,'端数本数'
                                ,'粉引'
                                ,'用途'
                                ,'予定用途'
                                ,'ロットNo'
                                ,'備考'])

df2 = df.query("年度==14").copy()

try:

    resultPurchase = session.query(Purchase)
    l_columns = list(df.columns)
 
    dicPurchase = dict(zip(l_columns, colPurchase))

    for index, row in df.query("年度==19").iterrows():
        #型変換
        row['入札NO'] = str(row['入札NO'])
        row['仕入日'] = row['仕入日'].date()
        row['粉引'] = float(round(Decimal(row['粉引']), 2))
        row['梱包重量'] = float(round(Decimal(row['梱包重量']), 2))
        row['端数重量'] = float(round(Decimal(row['端数重量']), 2))
        row['圃場'] = "" if row['圃場'] == 0 else str(row['圃場'])
        row['用途'] = "" if row['用途'] == 0 else str(row['用途'])
        row['予定用途'] = "" if row['予定用途'] == 0 else str(row['予定用途'])
        row['ロットNo'] = "" if row['ロットNo'] == 0 else str(row['ロットNo'])

        #仕入実績の存在チェック
        rec = resultPurchase.filter(Purchase.year == row['年度']).filter(Purchase.purchase == row['仕入先']).filter(Purchase.bid_no == row['入札NO']).first()
        if rec == None:
            print("データ無：%s/%s/%s" % (row['年度'], row['仕入先'], row['入札NO']))
            df2 = df2.append( row[0:20] )
        else:
            list = [ (key, value) for key, value in rec.__dict__.items() if key[0:1] != '_' ]
            keys, values = zip(*list)
            dicList = dict(zip(keys, values))
            for i in range(3, 20):
                #print(dicPurchase[l_columns[i]], dicList[dicPurchase[l_columns[i]]], row[l_columns[i]])
                if dicList[dicPurchase[l_columns[i]]] != row[l_columns[i]]:
                    df2= df2.append( row[0:20] )
                    print(i, row['年度'], row['仕入先'], row['入札NO'])
                    print(l_columns[i], dicList[dicPurchase[l_columns[i]]], row[l_columns[i]])
                    print(type(dicList[dicPurchase[l_columns[i]]]), type(row[i]))
                    break
    if len(df2) == 0:
        print("仕入実績無し！")
    else:
        df2.drop(columns=['余白','在庫引当'], axis=1, inplace=True)
        if isCheck:
            print("仕入確認")
            df2.to_csv("仕入実績_" + datetime.date.today().strftime("%Y%m%d") + ".csv", encoding='utf_8_sig')
        else:
            print("仕入登録")
            for index, row in df2.iterrows():
                values = [row['年度'],
                          row['仕入先'],
                          row['入札NO'],
                          row['仕入日'],
                          row['品種'],
                          row['茶期'],
                          row['格付'],
                          row['茶種'],
                          row['品柄'],
                          row['圃場'],
                          row['生産者'],
                          row['単価'],
                          row['梱包重量'],
                          row['梱包本数'],
                          row['端数重量'],
                          row['端数本数'],
                          row['粉引'],
                          row['用途'],
                          row['予定用途'],
                          row['ロットNo'],
                          '',
                          datetime.datetime.now()
                ]
                dicPurchase = dict(zip(colPurchase, values))
                #print(dicPurchase)
                upsertPurchase(dicPurchase)
except Exception as e:
    print(e)
finally:
    session.close()
