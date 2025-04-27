# 📚 Retseptiraamat

**Lihtne retseptihaldur ja poenimekirja koostaja**, mis kasutab Reacti, Apollo Clienti, GraphQL API-t ja Elasticsearchi.

---

## 🚀 Projekti eesmärk

See projekt on loodud katsetamaks ja rakendamaks:
- Elasticsearchi andmebaasi otsingu ja salvestuse jaoks
- GraphQL API ehitamist ja päringute haldamist
- Reacti ja Material UI kasutajaliidese loomisel
- Andmete normaliseerimist ja eksporti (nt Microsoft To Do jaoks)

---

## 🧱 Tehnoloogiad

- **React** (Vite projekt)
- **Apollo Client** (GraphQL päringud)
- **GraphQL** server
- **Elasticsearch** (8.x)
- **Docker** (Elasticsearch ja Kibana konteinerid)
- **Material UI** (UI komponentide raamistik)
- **uuid**, **unitConversion**, **categories** (väikesed utility moodulid)

---

## ⚙️ Paigaldamine ja käivitamine

### 1. Kloonimine ja install

```bash
git clone <repo-url>
cd retseptiraamat
npm install
```

### 2. Elasticsearchi ja Kibana käivitamine Dockeriga

Projekti juurest leiad `docker-compose.yml` faili.  
Käivita konteinerid:

```bash
docker-compose up -d
```

See tõstab:
- **Elasticsearch** üles pordil `9200`
- **Kibana** üles pordil `5601`

Kasutaja/parool (kui vaja):
- kasutaja: `elastic`
- parool: `changeme`


### 3. Frontendi käivitamine

```bash
npm run dev
```

See avab rakenduse aadressil [http://localhost:3000](http://localhost:3000).

### 4. GraphQL server

Projekti taustal töötab lihtne GraphQL server:
- `src/graphql/resolvers.ts`
- `src/graphql/typeDefs.ts`

Peamised päringud ja mutatsioonid:
- `recipes(query: String, serves: Int)`: otsib retsepte ja kohandab portsjoneid
- `shoppingList(recipes: [ShoppingListRecipeInput!])`: genereerib poenimekirja
- `addRecipe(recipe: RecipeInput!)`: lisab uue retsepti
- `addRating(title: String!, user: String!, value: RatingValue!)`: lisab hinnangu

---

## ✨ Peamised funktsioonid

- 🔎 **Retseptide otsing ja kuvamine**
- 👵 **Poenimekirja koostamine valitud retseptide põhjal**
- 📅 **Microsoft To Do sobiv eksport** (TXT failina)
- 📝 **Uute retseptide lisamine**
- 🌟 **Retseptide hinnangute andmine ja uuendamine**
- 🔄 **Portsjonite arvu dünaamiline kohandamine**

---

## 📅 Microsoft To Do eksport

Pärast poenimekirja koostamist saad:
- Vajutada nuppu **"Lae alla Microsoft To Do jaoks"**
- Laadida `.txt` faili, kus iga rida on kujul:

```
Osta 3 tk Kartulit
Osta 1 kg Riisi
Osta 2 prk Tomatikastet
```

To Do rakenduses saad need lihtsasti ülesannete listiks muuta:
- *Paste tasks* või *Import file*

---

## 📊 Tuleviku ideed

- [ ] Retsepti muutmise ja kustutamise võimalus
- [ ] Täiendav otsing filtreerimisega (kategooriate, koostisosade järgi)
- [ ] Responsive (mobiilisõbralik) vaade
- [ ] Shopping list grupituna kategooriate järgi (nt "Köögiviljad", "Piimatooted")
- [ ] CSV ja PDF eksport poenimekirjale

---

## 📜 Litsents

Privaatne projekt (isiklikuks ja õppimiseesmärgiks).  
Võib vabalt kasutada ja arendada edasi enda õppe- või hobiotstarbel.

