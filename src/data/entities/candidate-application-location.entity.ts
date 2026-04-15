import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CandidateApplicationEntity } from './candidate-application.entity';

@Entity({ name: 'candidate_application_locations' })
@Index(
  'candidate_application_locations_unique_triplet',
  ['oblys', 'audan', 'city'],
  {
    unique: true,
  },
)
export class CandidateApplicationLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  oblys: string;

  @Column()
  audan: string;

  @Column()
  city: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(
    () => CandidateApplicationEntity,
    (application) => application.location,
  )
  applications: CandidateApplicationEntity[];
}
