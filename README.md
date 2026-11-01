# Guildhall

A dark-fantasy project dashboard where your team runs work as D&D campaigns. Guildhall is your workspace,
campaigns are projects, quests are tasks, and the War Room is a drag-and-drop dashboard you arrange yourself.

Runs on iOS, Android and the web from one Expo (React Native) codebase.

Data is a mock, in-memory backend, so it resets when the app reloads.

## What you can do today

- Sign up, build a character (class and avatar), and switch between dark and "Daylight Tavern" themes.
- Edit your profile picture, banner, avatar icon, name and character class.
- Browse earned and locked achievements in an interactive badge grid.
- Found Guildhalls and launch Campaigns.
- Arrange the War Room: move and resize widgets on a snap-to-grid layout, with other widgets pushed out of the way.
- Quest Board: add quests and drag them between Backlog, In Progress, In Review and Slain.
- Dice Roller: roll d4 to d20, or roll to assign the next Backlog quest to a party member.
- Party Roster: see your party, their classes and roles.
- Initiative Tracker, Boss Fight, Campaign Journal, Calendar of Sessions, XP and Achievements, and Activity Feed.
- A loading cover on navigation that waits for destination data before revealing the page.
- Spellbook: add or remove widgets. Undo and redo layout changes.

## Requirements

- Node.js 20 or 22
- A phone with the Expo Go app, or any modern browser

## Install and run

```bash
npx create-expo-app@latest guildhall --template blank-typescript
cd guildhall
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-secure-store expo-crypto \
  expo-font expo-haptics react-native-safe-area-context react-native-screens react-native-gesture-handler \
  react-native-reanimated react-native-worklets @react-native-async-storage/async-storage react-dom \
  react-native-web @expo/metro-runtime @expo-google-fonts/cinzel @expo-google-fonts/crimson-text
npm i zustand zod
```

Copy this project's files over the new one, delete `App.tsx` and `index.ts`, and set
`"main": "expo-router/entry"` in `package.json`. Then:

```bash
npx expo start --clear
```

Press `w` for the browser, or scan the QR code with Expo Go.

## Using the War Room

| Action | How |
| --- | --- |
| Unlock editing | Press **Edit layout** (Guildmaster, Officer, Adventurer) |
| Move a widget | Hold its title bar for a moment, then drag |
| Resize a widget | Drag the corner triangle |
| Add a widget | Tap it in the **Spellbook**, or hold and drag it onto the grid |
| Delete widgets | Tap the X on a widget, or select some and press **Delete**, then confirm in the popup (Officer and above) |
| Resize with buttons | Select widgets, then use **Width: + -** and **Height: + -** |
| Undo or redo | **Undo** and **Redo** buttons in edit mode |
| Lock the layout | Press **Done** |
| Move a quest | Hold the card and drag sideways, or use the arrow buttons |

Every screen size keeps its own layout, so a phone and a desktop can be arranged differently. Tick widgets by tapping their titles (or press Select all) to resize or delete several at once.

## Roles

| Role | Can do |
| --- | --- |
| Guildmaster | Everything, including deleting the guildhall |
| Officer | Create campaigns and invites, delete quests and widgets, plus Adventurer actions |
| Adventurer | Create and move quests, arrange widgets |
| Squire | View only |

Permissions are enforced in the service layer on every write, not only by hiding buttons.

## Project layout

```
app/          screens and navigation (expo-router)
components/   shared UI: panels, buttons, fields
features/     warroom (grid engine), widgets (registry and widgets), character
services/     Api interface, Zod schemas, permissions, audit log, rate limit, realtime, mock backend
store/        Zustand state
theme/        palettes, fonts, useTheme
utils/        env, crypto, haptics and sound hooks
docs/         PHASES.txt
```

## Troubleshooting

- **Version errors or a very old Expo (for example SDK 44):** start from a fresh `create-expo-app@latest`
  folder and install packages only with `npx expo install`. Then run `npx expo-doctor`.
- **`npm audit` warnings:** these mostly come from build tooling. Do not run `npm audit fix --force`.
- **Widgets will not drag:** press Edit layout first, hold the title bar until it lifts, and make sure the
  window is wide enough for two columns.
- **Everything vanished after a reload:** expected for now. The mock backend is in memory.
- **Fonts or runes look wrong:** run `npx expo start --clear`.

## Security notes

All input is validated with shared Zod schemas, mutations are role-checked, rate-limited and written to an
append-only audit log, and tokens use `expo-secure-store` on native. The mock backend is not real
security: see the `TODO(supabase)` comments for what the server must enforce. Only `EXPO_PUBLIC_*`
variables reach the app bundle, so never put secrets in them.
