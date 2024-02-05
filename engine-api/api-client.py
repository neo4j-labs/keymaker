import requests
from pprint import pprint

while True:
    title = input("Enter a movie title or press ENTER to quit: ")
    if title == '':
        break
    query = "query { recommendations(engineID: 1, context: {startMovieTitle: \"" + \
        title + "\"}) { recommendation score }}"
    r = requests.post('http://localhost:4000', json={'query': query})
    recommendations = r.json()['data']['recommendations']
    recommended_titles = []
    for rec in recommendations:
        title = rec['recommendation']['title']
        print(title)
