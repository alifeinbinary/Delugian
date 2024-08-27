import { MidiNumbers } from "react-piano";

/**
 * Converts a given midi number to it's corresponding letter form. (ex. 48 = C)
 * @param midiNumber A midi number to convert to a note
 * @returns A note represented as a string without the octave.
 */
export const midiNumberToNote = (midiNumber: number): string => {
  return MidiNumbers.getAttributes(midiNumber)
    .note.toLowerCase()
    .replace(/[0-9]/, "");
};
