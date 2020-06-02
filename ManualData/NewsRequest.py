import requests
import json
import ftplib

titles = list()
countries = ['us','br','ru','de','au']
NewsURLS =['https://newsapi.org/v2/top-headlines?country='+c+'&pageSize=100&apiKey=92ec6d834dc8406d8293647200d8c0cd' for c in countries]
fl_badrequest = False

filename = 'NewsData.json'

ftp_user = 'u1005817_IfaNews'
ftp_pass = 'InTheFieldOfAnxiety2020'
ftp_ip = '31.31.196.24'
ftp_port = 21
ftp_dstdir = '/assets'

# ================= Download articles from News API =====================================
for url in NewsURLS:
    r = requests.get(url)
    
    if r.status_code != 200:
        print('Error in request')
        print(r.status_code)
        fl_badrequest = True
        break

    articles = r.json()['articles']
    for art in articles:
        if (art['author'] not in [None,'',' ']):
            source = art['author']
        elif (art['source']['name'] not in [None,'',' ']):
            source = art['source']['name']
        else: 
            source = 'Anonymous'       
        titles.append({'source':source, 'title':art['title']})

titles.append({'source':'This data send over ftp session. News downloaded using Requests lib', 'title':'Final test'})

print('Articles downloaded:')
print(len(titles))

if fl_badrequest:
    print('There were bad requests. End of script')
    quit()

# ==================== Save news titles ===================================================
print('All requests done. Save data to file')
with open(filename, "w",encoding='utf-8') as write_file: 
    json.dump({'data':titles}, write_file, indent = '\t', ensure_ascii=False)


# =================== Send news titles to web site ====================================================
print('Open ftp session')
ftp_obj = ftplib.FTP()
ftp_obj.connect(ftp_ip,ftp_port)
ftp_obj.login(ftp_user,ftp_pass)
ftp_obj.cwd(ftp_dstdir)

with open(filename, 'rb') as fobj:
    ftp_obj.storbinary('STOR ' + 'NewsData.json', fobj, 1024)

ftp_obj.quit()

print('End of script')