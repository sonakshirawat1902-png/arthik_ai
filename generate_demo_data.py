import random, csv, json, datetime as dt
from collections import defaultdict
random.seed(42)
products=[
("P01","Block-Print Bedsheet Set","Home Textiles",1800,1050),
("P02","Blue Pottery Vase","Decor",950,520),
("P03","Brass Diya Set","Festive",600,330),
("P04","Jaipuri Razai (Quilt)","Home Textiles",3200,2350),
("P05","Handmade Soap Gift Box","Gifts",450,160),
("P06","Scented Candle Trio","Gifts",700,280),
("P07","Wooden Jewellery Box","Decor",1200,640),
("P08","Cushion Cover Pair","Home Textiles",700,360),
("P09","Terracotta Planter","Decor",400,260),
("P10","Silk Scarf","Accessories",1500,800),
("P11","Leather Wallet","Accessories",1100,700),
("P12","Ceramic Mug Set","Kitchen",800,590),
]
# monthly base units per product (Jan..Sep)
base={"P01":[30,29,31,30,32,30,31,33,32],"P02":[14,15,14,16,15,15,16,15,15],"P03":[10,9,10,9,10,11,12,14,15],
"P04":[22,20,12,6,5,4,4,7,9],"P05":[28,30,29,31,33,34,35,37,38],"P06":[16,17,18,17,18,19,18,19,19],
"P07":[9,9,10,9,10,10,11,10,10],"P08":[22,21,22,23,22,21,22,23,22],"P09":[18,19,20,21,22,22,21,20,18],
"P10":[8,8,9,10,9,9,8,9,9],"P11":[7,7,8,7,8,7,7,8,7],"P12":[24,24,25,26,25,26,27,28,30]}
months=list(range(1,10))
sales=[];sid=1
for mi,m in enumerate(months):
    nd=(dt.date(2026,m+1,1)-dt.timedelta(days=1)).day if m<12 else 31
    for p in products:
        pid,name,cat,price,cost=p
        units=int(round(base[pid][mi]*2.3))
        # Sept: bedsheet cost hike, higher discounting on Razai/Mug
        ucost=cost
        if pid=="P01" and m>=9: ucost=1190
        left=units
        while left>0:
            qty=min(left,random.choices([1,2,3],[0.7,0.2,0.1])[0]);left-=qty
            d=random.randint(1,nd)
            disc=0
            if m==9 and pid in("P04","P12"): disc=random.choice([0,0.10,0.15,0.15])
            elif random.random()<0.08: disc=0.05
            ch=random.choices(["Store","Online","WhatsApp"],[0.55,0.30,0.15])[0]
            sales.append([f"S{sid:05d}",dt.date(2026,m,d).isoformat(),pid,qty,price,round(price*qty*disc,2),ucost,ch]);sid+=1
sales.sort(key=lambda r:(r[1],r[0]))
for i,r in enumerate(sales):r[0]=f"S{i+1:05d}"
# expenses
fixed={"Rent":45000,"Salaries":95000,"Utilities":None,"Software":3500}
exp=[];eid=1
def add(m,day,cat,amt,vendor,note=""):
    global eid
    exp.append([f"E{eid:04d}",dt.date(2026,m,day).isoformat(),cat,round(amt,2),vendor,note]);eid+=1
for m in months:
    add(m,1,"Rent",45000,"Landlord – MI Road shop")
    add(m,28,"Salaries",95000 if m<7 else 98000,"Payroll","3 staff")
    add(m,10,"Utilities",[7800,7200,8100,9600,11200,12400,12900,12100,9400][m-1],"Electricity & internet")
    add(m,5,"Software",3500,"POS & accounting subscription")
    mk=[16000,15000,17000,16500,18000,17500,16000,18500,36000][m-1]
    add(m,12,"Marketing",mk*0.6,"Meta & Google Ads"); add(m,20,"Marketing",mk*0.4,"Influencer & print" if m==9 else "Local promotion")
    lg=[9500,9800,10200,10000,10600,10400,10800,11000,14800][m-1]
    add(m,15,"Logistics",lg,"Courier partners","Includes festive-season surcharge" if m==9 else "")
    pk=[4200,4100,4400,4500,4600,4700,4800,4900,6300][m-1]
    add(m,8,"Packaging",pk,"Jaipur Packaging Co.")
    add(m,22,"Miscellaneous",[2500,3100,2200,2800,2600,3500,2900,3000,4100][m-1],"Repairs & petty cash")
# write
import os
os.makedirs("data",exist_ok=True)
with open("data/products.csv","w",newline="") as f:
    w=csv.writer(f);w.writerow(["product_id","name","category","list_price","unit_cost"]);[w.writerow(p) for p in products]
with open("data/sales.csv","w",newline="") as f:
    w=csv.writer(f);w.writerow(["sale_id","date","product_id","quantity","unit_price","discount_amount","unit_cost_at_sale","channel"]);[w.writerow(r) for r in sales]
with open("data/expenses.csv","w",newline="") as f:
    w=csv.writer(f);w.writerow(["expense_id","date","category","amount","vendor","note"]);[w.writerow(r) for r in exp]
# metrics
pn={p[0]:p for p in products}
M=defaultdict(lambda:dict(rev=0,cogs=0,units=0,opex=0))
P=defaultdict(lambda:defaultdict(lambda:dict(rev=0,cogs=0,units=0)))
for s in sales:
    m=int(s[1][5:7]);rev=s[3]*s[4]-s[5];cg=s[3]*s[6]
    M[m]['rev']+=rev;M[m]['cogs']+=cg;M[m]['units']+=s[3]
    P[m][s[2]]['rev']+=rev;P[m][s[2]]['cogs']+=cg;P[m][s[2]]['units']+=s[3]
E=defaultdict(lambda:defaultdict(float))
for e in exp:
    m=int(e[1][5:7]);M[m]['opex']+=e[3];E[m][e[2]]+=e[3]
out={}
for m in months:
    d=M[m];gp=d['rev']-d['cogs'];np_=gp-d['opex']
    out[m]=dict(rev=round(d['rev'],2),cogs=round(d['cogs'],2),gp=round(gp,2),opex=round(d['opex'],2),net=round(np_,2),gm=round(gp/d['rev']*100,2),nm=round(np_/d['rev']*100,2),units=d['units'])
    print(m,out[m])
print("sales rows",len(sales),"exp rows",len(exp))
print("Sep exp",dict(E[9]));print("Aug exp",dict(E[8]))
for m in (8,9):
    print("prods",m)
    for pid,v in sorted(P[m].items(),key=lambda x:-(x[1]['rev']-x[1]['cogs'])):
        print(pid,pn[pid][1],round(v['rev']),round(v['rev']-v['cogs']),round((v['rev']-v['cogs'])/v['rev']*100,1),v['units'])
# YTD
yp=defaultdict(lambda:dict(rev=0,cogs=0,units=0))
for m in months:
    for pid,v in P[m].items():
        for k in v: yp[pid][k]+=v[k]
print("YTD")
for pid,v in sorted(yp.items(),key=lambda x:-(x[1]['rev']-x[1]['cogs'])):
    print(pid,pn[pid][1],round(v['rev']),round(v['rev']-v['cogs']),round((v['rev']-v['cogs'])/v['rev']*100,1))
ytd=dict(rev=sum(out[m]['rev'] for m in months),net=sum(out[m]['net'] for m in months),opex=sum(out[m]['opex'] for m in months),gp=sum(out[m]['gp'] for m in months))
print(ytd)

# golden file
gold={"currency":"INR","business":"Rangoli Home & Gifts (Demo)","months":{},"sep_vs_aug_expense_by_category":{},"products":{}}
for m in months:
    gold["months"][f"2026-{m:02d}"]=out[m]
for c in E[9]: gold["sep_vs_aug_expense_by_category"][c]={"aug":E[8][c],"sep":E[9][c],"change":round(E[9][c]-E[8][c],2)}
for per,ms in {"2026-09":[9],"2026-08":[8],"ytd":months}.items():
    d=defaultdict(lambda:dict(rev=0,cogs=0,units=0))
    for m in ms:
        for pid,v in P[m].items():
            for k in v: d[pid][k]+=v[k]
    gold["products"][per]=sorted([dict(id=pid,name=pn[pid][1],revenue=round(v['rev'],2),cogs=v['cogs'],gross_profit=round(v['rev']-v['cogs'],2),margin_pct=round((v['rev']-v['cogs'])/v['rev']*100,2),units=v['units']) for pid,v in d.items()],key=lambda x:-x['gross_profit'])
json.dump(gold,open("data/golden_metrics.json","w"),indent=2)
