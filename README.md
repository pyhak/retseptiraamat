📚 Retseptiraamat

Lihtne retseptihaldur ja poenimekirja koostaja, mis kasutab Reacti, Apollo Clienti, GraphQL API-t, OpenAI generatsiooni ja Elasticsearchi.

🚀 Projekti eesmärk

See projekt on loodud katsetamaks ja rakendamaks:

🔍 Elasticsearchi andmebaasi otsingu ja salvestuse jaoks

🌐 GraphQL API loomist ja tüübiturvalist päringute haldamist

⚛️ Reacti ja Material UI kasutajaliidest

🤖 OpenAI API kasutust retseptide genereerimiseks

🧠 Andmete normaliseerimist ja eksporti (nt Microsoft To Do jaoks)

🧱 Tehnoloogiad

React (Vite projekt)

Apollo Client (GraphQL päringud)

GraphQL server (Apollo Server)

Elasticsearch (8.x)

Docker (Elasticsearch ja Kibana konteinerid)

Material UI (UI komponentide raamistik)

OpenAI (ChatGPT integratsioon retseptide loomiseks)

uuid, unitConversion, categories (utility moodulid)

⚙️ Paigaldamine ja käivitamine

1. Kloonimine ja install

git clone <repo-url>
cd retseptiraamat
npm install

2. Elasticsearchi ja Kibana käivitamine Dockeriga

docker-compose up -d

See tõstab:

Elasticsearch üles pordil 9200

Kibana üles pordil 5601

Vajadusel kasutaja/parool:

kasutaja: elastic

parool: changeme

3. .env konfiguratsioon

Elasticsearchi ühenduse jaoks tuleb luua .env fail:

# Elasticsearch serveri aadress (kohalik docker-compose jooksutatud Elasticsearch)
ELASTICSEARCH_NODE=http://localhost:9200

# Kasutajanimi ja parool Elasticsearchi ühenduseks
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=xxx

Kui kasutad ka OpenAI generatsiooni, lisa:

OPENAI_API_KEY=...

4. Serveri käivitamine ja andmete initsialiseerimine

cd rr-server
npm install

# Lae esmased andmed Elasticsearchi (kategooriad, koostisosad jne)
npm run seed

# Käivita GraphQL server
npm run dev

GraphQL server töötab pordil 4000 ja pakub dokumenteeritud API-t.

5. Frontendi käivitamine

cd rr-client
npm install
npm run dev

Rakendus avaneb aadressil http://localhost:3000.

✨ Peamised funktsioonid

🔎 Retseptide otsing ja kuvamine Elasticsearchist

🤖 AI-põhine retsepti genereerimine OpenAI abil

📝 Uute retseptide lisamine vormi kaudu

✅ Uute koostisosade automaatne lisamine

🛒 Poenimekirja koostamine valitud retseptide põhjal

📄 Microsoft To Do eksport .txt failina

🔄 Portsjonite dünaamiline muutmine (nt 2 → 6 inimesele)

🧠 Uute kategooriate automaatne tuvastus ja salvestamine

🧠 OpenAI kasutus

Võimalus sisestada vabas vormis küsimus (nt „kanawok köögiviljadega“), mille põhjal:

OpenAI tagastab JSON-struktuuris retsepti

Rakendus täidab automaatselt pealkirja, õpetuse, koostisosad jne

Uued kategooriad lisatakse Elasticsearchi automaatselt

🧾 Microsoft To Do eksport

Pärast poenimekirja koostamist saad vajutada:

⬇️ Lae alla Microsoft To Do jaoks

Laaditakse .txt fail kujul:

Osta 3 tk Kartulit
Osta 1 kg Riisi
Osta 2 prk Tomatikastet

Mis sobib To Do "Paste as tasks" funktsiooniga.

📦 Tulevikuplaanid



📜 Litsents

Privaatne projekt õppe- ja katsetamise eesmärgil.
Võid vabalt kloonida ja edasi arendada.

© 2025 Madis Mätlik

