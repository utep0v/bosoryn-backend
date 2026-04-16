import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CandidateApplicationEntity } from './candidate-application.entity';
import { RegionOblysEntity } from './region-oblys.entity';

@Entity({ name: 'candidate_application_locations' })
@Index('candidate_application_locations_unique_pair', ['oblysId', 'audan'], {
  unique: true,
})
export class CandidateApplicationLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  oblysId: string | null;

  @Column({ type: 'text', nullable: true })
  oblys: string | null;

  @Column({ type: 'text', nullable: true })
  audan: string | null;

  @Column({ type: 'varchar', nullable: true, default: 'district' })
  type: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(
    () => RegionOblysEntity,
    (oblys) => oblys.candidateApplicationLocations,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'oblysId' })
  oblysRef: RegionOblysEntity | null;

  @OneToMany(
    () => CandidateApplicationEntity,
    (application) => application.location,
  )
  applications: CandidateApplicationEntity[];
}
