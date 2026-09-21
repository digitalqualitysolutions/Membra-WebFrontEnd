"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { FormField } from "@/features/club/components/form-field";
import { compactInput } from "@/features/club/components/record-parts";
import type { NewAddressValues } from "@/features/club/services/state";
import type { ClubAddress } from "@/features/club/types";

/** An address with nothing in it yet. */
export const blankAddressValues: NewAddressValues = {
  name: "",
  shortName: "",
  streetName: "",
  streetNumber: "",
  zip: "",
  city: "",
  region: "",
  directions: "",
};

/** A saved address as the fields edit it. */
export function addressValuesOf(address: ClubAddress): NewAddressValues {
  return {
    name: address.name,
    shortName: address.short,
    streetName: address.streetName,
    streetNumber: address.streetNumber,
    zip: address.zip,
    city: address.city,
    region: address.region ?? "",
    directions: address.directions ?? "",
  };
}

/** The fields an address can't be saved without. */
const required = [
  "name",
  "shortName",
  "streetName",
  "streetNumber",
  "zip",
  "city",
] as const;

export function isAddressComplete(values: NewAddressValues) {
  return required.every((field) => values[field].trim().length > 0);
}

/**
 * What each field will take, as it's typed.
 *
 * Refused at the keyboard rather than argued with at the save: there is no
 * club whose postcode is `vnbcnnb`, and a field that lets someone type it,
 * then tells them off for it two fields later, wasted their time twice. The
 * phone field on the contact card works the same way.
 *
 * Written against `\p{L}` rather than `a-z`, because "København", "Zürich"
 * and "Kraków" are ordinary city names and a rule that can't spell them is
 * worse than no rule.
 */
const filters: Partial<Record<keyof NewAddressValues, RegExp>> = {
  /** A title: "Main hall", "Court 1 & 2", "St. Mary's (annexe)". */
  name: /[^\p{L}\p{N}\s.,'&()/-]/gu,
  /** A code, and only a code: "MH", "HH2". No spaces, no punctuation. */
  shortName: /[^\p{L}\p{N}]/gu,
  /** Numbered streets are ordinary — "5th Avenue", "Rue 22 Mars". */
  streetName: /[^\p{L}\p{N}\s.,'/-]/gu,
  /** A number with a letter on it: "32B", "12-14", "7/9". */
  streetNumber: /[^\p{L}\p{N}\s/-]/gu,
  /** A name, not a number: "2100 København" is two fields, not one. */
  city: /[^\p{L}\s.'-]/gu,
  region: /[^\p{L}\s.'-]/gu,
  /*
   * Letters and digits, wherever the club is. A postcode is `2100` in
   * Denmark, `123 45` in Sweden, `SW1A 1AA` in Britain and nothing at all in
   * the Emirates — so what the field refuses is the symbols no country uses,
   * and how many digits go in which order is left to the person who lives
   * there.
   */
  zip: /[^\p{L}\p{N}\s-]/gu,
  // Directions is a sentence about a place. Anything can be in one.
};

export function cleanAddressValue(
  field: keyof NewAddressValues,
  value: string,
) {
  const flattened = value
    // Every one of these fields is a single line, so a newline pasted in from
    // a copied address becomes a space rather than nothing — the parts either
    // side of it stay apart.
    .replace(/[\r\n\t]+/g, " ")
    // `\p{Cc}` rather than the range written out: the range is invisible
    // characters, and a regex holding them is one nobody can read or edit.
    .replace(/\p{Cc}/gu, "");

  const filter = filters[field];

  return filter ? flattened.replace(filter, "") : flattened;
}
/**
 * The fields of one address, laid out the same wherever an address is typed:
 * the setup card and the club card's address editor.
 *
 * Two rows, in the order an address is read:
 *
 *   Name · Short · Street · Street no.
 *   City · Zip code · Region · Directions
 *
 * On a twelve-column grid. The first line is sized to its parts: a name or
 * street gets a third of the row, a short code or street number a sixth. The
 * second line gives the three short fields a sixth each - city, zip and region
 * are read as one place, and matching them keeps the eye moving along the line
 * instead of down it - and hands the other half to the directions, the one
 * field a whole sentence goes into. At two columns the name and directions
 * take a row each and the rest pair up. The length limits are the API's.
 */
export function AddressFields({
  value,
  onChange,
  autoFocus = false,
}: {
  value: NewAddressValues;
  onChange: (patch: Partial<NewAddressValues>) => void;
  /** Put the cursor in the first field - for an editor that has just opened. */
  autoFocus?: boolean;
}) {
  const t = useTranslations("club");
  const requiredLabel = t("setup.required");

  const field = (
    key: keyof NewAddressValues,
    label: string,
    placeholder: string,
    maxLength: number,
    className?: string,
  ) => {
    const optional = key === "directions" || key === "region";

    return (
      <FormField
        label={label}
        required={!optional}
        requiredLabel={requiredLabel}
        className={className}
      >
        <Input
          className={compactInput}
          value={value[key]}
          maxLength={maxLength}
          onChange={(event) =>
            onChange({
              [key]: cleanAddressValue(key, event.target.value),
            })
          }
          placeholder={placeholder}
          aria-label={label}
          aria-required={!optional || undefined}
          autoFocus={autoFocus && key === "name"}
        />
      </FormField>
    );
  };

  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-12">
      {field(
        "name",
        t("setup.address.name"),
        t("setup.address.namePlaceholder"),
        60,
        "sm:col-span-2 lg:col-span-4",
      )}
      {field(
        "shortName",
        t("fields.short"),
        t("setup.address.shortPlaceholder"),
        20,
        "lg:col-span-2",
      )}
      {field(
        "streetName",
        t("setup.address.streetName"),
        t("setup.address.streetNamePlaceholder"),
        60,
        "lg:col-span-4",
      )}
      {field(
        "streetNumber",
        t("setup.address.streetNumber"),
        t("setup.address.streetNumberPlaceholder"),
        20,
        "lg:col-span-2",
      )}
      {field(
        "city",
        t("setup.address.city"),
        t("setup.address.cityPlaceholder"),
        100,
        "lg:col-span-2",
      )}
      {field(
        "zip",
        t("setup.address.zip"),
        t("setup.address.zipPlaceholder"),
        14,
        "lg:col-span-2",
      )}
      {field(
        "region",
        t("setup.address.region"),
        t("setup.address.regionPlaceholder"),
        100,
        "lg:col-span-2",
      )}
      {field(
        "directions",
        t("setup.address.directions"),
        t("setup.address.directionsPlaceholder"),
        255,
        "sm:col-span-2 lg:col-span-6",
      )}
    </div>
  );
}
