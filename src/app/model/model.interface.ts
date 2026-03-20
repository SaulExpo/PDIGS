export interface Pet {
  id: string;
  name: string;
  type: string;
  age: number;
  breed: string;
  userId: string;
}

export interface DiaryEntry {
  id: string;
  petId: string;
  date: string;
  title: string;
  description: string;
  userId: string;
}

export interface Diet {
  id: string;
  petId: string;
  name: string;
  description: string;
  userId: string;
}
