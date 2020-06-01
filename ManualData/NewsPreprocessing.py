import json
import os

titles = list()

#Каталог из которого будем брать файлы
directory = '0106'
filename = 'result.json'

#Получаем список файлов в переменную files
files = os.listdir(directory)
for f in files:
    path = os.path.join(directory,f)
    print(path)
    with open(path, "r", encoding='utf-8', newline='') as read_file:
        data = json.load(read_file)
    articles = data['articles']
    print(len(articles))
    for art in articles:
        if (art['author'] != None)and(art['author'] != '')and(art['author'] != ' '):
            source = art['author']
        elif (art['source']['name'] not in [None,'',' ']):
            source = art['source']['name']
        else: 
            source = 'Anonymous'       
        titles.append({'source':source, 'title':art['title']})
print(len(titles))

with open(filename, "w",encoding='utf-8') as write_file: 
    json.dump({'data':titles}, write_file, indent = '\t', ensure_ascii=False)
