# Harbor

Berth scheduling for a small port.

## Run it

```sh
npm install
npm run dev
```

## How booking works

Each arriving vessel gets the **smallest free berth** that fits its length. A berth is held for
six hours after arrival. See [`src/schedule.ts`](src/schedule.ts).

| Berth | Longest vessel |
| ----- | -------------- |
| 1     | 120 m          |
| 4     | 320 m          |

- [x] Booking by length
- [ ] Tide windows (`scripts/tides.py`)
