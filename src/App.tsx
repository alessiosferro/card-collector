import React, {ChangeEventHandler, FormEventHandler, useEffect, useMemo, useState} from 'react';
import {Card} from "./model/card";
import {from, Subject, switchMap} from "rxjs";

import './index.css';
import styles from './App.module.css';

const App = () => {
  const [name, setName] = useState("");
  const [photosValue, setPhotosValue] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [cards, setCards] = useState<{[cardName: string]: Card[]}>({});

  const refreshCards = useMemo(() => new Subject<void>(), []);

  useEffect(() => {
    refreshCards.pipe(
      switchMap(() => from(fetch('http://172.20.10.2:3001/cards')).pipe(
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

    await fetch('http://172.20.10.2:3001/cards', {
      method: 'POST',
      body: JSON.stringify({
        name,
        photos,
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
      <form className={styles.Form} onSubmit={submitHandler}>
        <div className={styles.FormControl}>
          <label className={styles.FormControlLabel} htmlFor="cardName">Card name</label>
          <input className={[styles.FormControlInput, styles.FormControlInputText].join(" ")} value={name} onChange={(ev) => setName(ev.target.value)} id="cardName" name="cardName" type="text" />
        </div>

        <div className={styles.FormControl}>
          <label className={styles.FormControlLabel} htmlFor="photo">Photo</label>
          <input className={styles.FormControlInput} value={photosValue} multiple onChange={readFileHandler} type="file" id="photo" name="photo" accept="image/*"  />
        </div>

        <button className={styles.SubmitButton} type="submit">Submit data</button>

        {Object.entries(cards).map(([cardName, cards]) => <div key={cardName}>
          <h3>Card name</h3>
          <p>{cardName} ({cards.length})</p>

          {cards.map((card, index) => <div className={styles.PhotosList} key={index}>
            {card.photos.map((photo, index) => <img alt="" className={styles.PhotosListItem} key={index} src={photo} />)}
          </div>)}
        </div>)}
      </form>
    </>
  )
}

export default App;
