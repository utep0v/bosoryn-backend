import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
