import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CandidateApplicationLocationEntity } from './candidate-application-location.entity';

@Entity({ name: 'candidate_applications' })
export class CandidateApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  specialty: string;

  @Column({ type: 'varchar', length: 12 })
  iin: string;

  @Column()
  educationLevel: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ type: 'text', nullable: true })
  oblys: string | null;

  @Column({ type: 'text', nullable: true })
  audan: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(
    () => CandidateApplicationLocationEntity,
    (location) => location.applications,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'locationId' })
  location: CandidateApplicationLocationEntity | null;
}
