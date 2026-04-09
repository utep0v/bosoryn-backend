import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VacancyEntity } from './vacancy.entity';

@Entity({ name: 'applications' })
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  vacancyId: string;

  @Column()
  fullName: string;

  @Column()
  phone: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'varchar', default: 'pending' })
  emailStatus: string;

  @Column({ type: 'varchar', default: 'pending' })
  whatsappStatus: string;

  @Column({ type: 'text', nullable: true })
  emailError: string | null;

  @Column({ type: 'text', nullable: true })
  whatsappError: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  attemptedAt: Date | null;

  @ManyToOne(() => VacancyEntity, (vacancy) => vacancy.applications, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vacancyId' })
  vacancy: VacancyEntity;
}
