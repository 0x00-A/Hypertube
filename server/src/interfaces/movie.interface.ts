export interface IMovie {
  id?: string; // TODO: align with Mongo _id
  title: string;
  year: number;
  rating?: number;
  coverUrl?: string;
}
