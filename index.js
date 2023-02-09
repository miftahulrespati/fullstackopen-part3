import express from "express";
import morgan from "morgan";
import cors from "cors";
import { readFile } from 'fs/promises';
const jsonPersons = JSON.parse(
  await readFile(
    new URL('./persons.json', import.meta.url)
  )
);

let persons = jsonPersons;

const app = express();
app.use(express.json());

morgan.token("body", (req) => {
  return JSON.stringify(req.body);
});
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);
app.use(cors());

app.get("/", (_, response) => {
  response.send("It works!");
});

app.get("/info", (_, response) => {
  const info = `<p>Phonebook has info for ${persons.length} people</p>
                <p>${new Date()}</p>`;
  response.send(info);
});

app.get("/api/persons", (_, response) => {
  response.json(persons);
});

app.get("/api/persons/:id", (request, response) => {
  const id = request.params.id;
  const person = persons.find((person) => {
    return person.id === id;
  });
  if (person) {
    response.json(person);
  } else {
    response.status(404).send({ message: "Contact not found" });
  }
});

const generateId = () => {
  const idLength = 5;
  let id;
  do {
    id = Math.floor(Math.random() * Math.pow(10, idLength));
  } while (persons.some((person) => person.id === id));
  return id.toString().padStart(idLength, "0");
};

app.post("/api/persons", (request, response) => {
  const body = request.body;
  const name = body.name.trim();
  const number = body.number.trim();
  if (!name || !number) {
    return response
      .status(400)
      .send({ message: "Please provide name and number" });
  } else if (persons.some((person) => person.name === name)) {
    return response
      .status(400)
      .send({ message: `Name ${name} already exists` });
  }

  const person = {
    id: generateId(),
    name: name,
    number: number,
  };

  persons = persons.concat(person);
  response.json(person);
});

app.delete("/api/persons/:id", (request, response) => {
  const id = request.params.id;

  if (!persons.some((person) => person.id === id)) {
    response
      .status(404)
      .send({ message: "Contact not found or already deleted" });
    return;
  }

  persons = persons.filter((person) => person.id !== id);
  response.status(200).json({ message: "Contact deleted" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
