import React, {ChangeEventHandler, FormEventHandler, useEffect, useMemo, useState} from 'react';
import {Card} from "./model/card";
import {from, Subject, switchMap} from "rxjs";

import styles from './App.module.css';
import {SelectOptions} from "./model/option";

const App = () => {
  const [name, setName] = useState("");
  const [photosValue, setPhotosValue] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [type, setType] = useState<string>();
  const [cards, setCards] = useState<{[cardName: string]: Card[]}>({});
  const [pokemonTypeOptions, setPokemonTypeOptions] = useState<SelectOptions>({
    isLoading: true,
    items: []
  });

  const refreshCards = useMemo(() => new Subject<void>(), []);

  useEffect(() => {
    (async () => {
      const response = await fetch('http://localhost:3000/pokemonTypeOptions');
      const options = await response.json();
      setPokemonTypeOptions({ isLoading: false, items: options });
    })()
  }, []);

  useEffect(() => {
    refreshCards.pipe(
      switchMap(() => from(fetch('http://localhost:3000/cards')).pipe(
        switchMap((response) => from(response.json()))
      )),
    ).subscribe((cards: Card[]) => {
      setCards(cards.reduce((acc: {[name: string]: Card[]}, card) => ({
        ...acc,
        [card.name]: [
          ...(acc[card.name] ? acc[card.name] : []),
          card
        ],
      }), {}))
    });

    refreshCards.next();
  }, []);

  const submitHandler: FormEventHandler = async (event) => {
    event.preventDefault();

    await fetch('http://localhost:3000/cards', {
      method: 'POST',
      body: JSON.stringify({
        name,
        photos,
        type
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    setPhotosValue("");
    setName("");
    setPhotos([]);

    refreshCards.next();
  }

  const readFileHandler: ChangeEventHandler<HTMLInputElement> = async (event): Promise<void> => {
    if (!event.target.files) return;

    setPhotosValue(event.target.value);

    const filesBase64: string[] = await Promise.all(Array.from(event.target.files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = () => resolve(fileReader.result as string);

        try {
          fileReader.readAsDataURL(file);
        } catch {
          reject('error during file read');
        }
      })
    }));

    setPhotos(filesBase64);
  }

  return (
    <>
      <form onSubmit={submitHandler}>
        <div>
          <label htmlFor="cardName">Card name</label>
          <input value={name} onChange={(ev) => setName(ev.target.value)} id="cardName" name="cardName" type="text" />
        </div>

        <div>
          <label htmlFor="type">Type</label>
          <select name="type" id="type" onChange={ev => setType(ev.target.value)}>
            {pokemonTypeOptions.items.map(option => <option value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="photo">Photo</label>
          <input value={photosValue} multiple onChange={readFileHandler} type="file" id="photo" name="photo" accept="image/*"  />
        </div>

        <button type="submit">Submit data</button>
      </form>

      {Object.entries(cards).map(([cardName, cards]) => <div key={cardName}>
        <h3>Card name</h3>
        <p>{cardName} ({cards.length})</p>

        {cards.map(card => <div className={styles.PhotosList} key={card.id}>
          {card.photos.map((photo, index) => <img alt="" className={styles.PhotosListItem} height={400} width={300} key={index} src={photo} />)}
        </div>)}
      </div>)}
    </>
  )
}

export default App;
