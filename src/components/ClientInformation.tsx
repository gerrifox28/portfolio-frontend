import React from 'react';

export interface Person {
  name: string;
  dob: string;
}

function calculateAge(dobString: string): number | null {
  if (!dobString) return null;
  const [month, day, year] = dobString.split('/').map(Number);
  if (!month || !day || !year) return null;
  const dob = new Date(year, month - 1, day);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  if (dob > today) return null;
  let age = today.getFullYear() - dob.getFullYear();
  if (today < new Date(today.getFullYear(), month - 1, day)) age--;
  return age;
}

function formatDOBInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function validateDOB(dobString: string): string | null {
  if (dobString.length < 10) return null;
  const age = calculateAge(dobString);
  if (age === null) return 'Please enter a valid date of birth.';
  if (age > 120) return 'Please check the date of birth entered.';
  return null;
}

interface PersonFieldsProps {
  label: string;
  values: Person;
  onChange: (p: Person) => void;
  required?: boolean;
}

function PersonFields({ label, values, onChange, required = false }: PersonFieldsProps) {
  const age = calculateAge(values.dob);
  const dobError = required || values.name || values.dob ? validateDOB(values.dob) : null;

  return (
    <div className="person-fields">
      <h3 className="person-label">{label}</h3>

      <div className="client-field">
        <label>Name</label>
        <input
          type="text"
          maxLength={50}
          placeholder="First and Last Name"
          value={values.name}
          onChange={e => onChange({ ...values, name: e.target.value })}
        />
      </div>

      <div className="client-field">
        <label>Date of Birth</label>
        <input
          type="text"
          placeholder="MM/DD/YYYY"
          maxLength={10}
          value={values.dob}
          onChange={e => onChange({ ...values, dob: formatDOBInput(e.target.value) })}
        />
        {dobError && <p className="client-field-error">{dobError}</p>}
      </div>

      <div className="client-field">
        <label>Age</label>
        <input
          type="text"
          value={age !== null ? String(age) : '—'}
          readOnly
          disabled
          className="age-readonly"
        />
      </div>
    </div>
  );
}

interface Props {
  person1: Person;
  person2: Person;
  onChangePerson1: (p: Person) => void;
  onChangePerson2: (p: Person) => void;
}

export default function ClientInformation({ person1, person2, onChangePerson1, onChangePerson2 }: Props) {
  return (
    <section className="client-section">
      <div className="client-inner">
        <h2 className="client-heading">Client Information</h2>
        <div className="client-two-column">
          <PersonFields label="Person 1" values={person1} onChange={onChangePerson1} required />
          <PersonFields label="Person 2" values={person2} onChange={onChangePerson2} />
        </div>
      </div>
    </section>
  );
}
