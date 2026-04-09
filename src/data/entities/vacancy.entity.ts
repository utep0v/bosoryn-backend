import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApplicationEntity } from './application.entity';
import { RegionEntity } from './region.entity';
import { SchoolEntity } from './school.entity';
import { SubjectEntity } from './subject.entity';

@Entity({ name: 'vacancies' })
export class VacancyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  regionId: string;

  @Column('uuid')
  schoolId: string;

  @Column('uuid')
  subjectId: string;

  @Column({ type: 'varchar' })
  teachingLanguage: string;

  @Column()
  graduationYear: number;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => RegionEntity, (region) => region.vacancies, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'regionId' })
  region: RegionEntity;

  @ManyToOne(() => SchoolEntity, (school) => school.vacancies, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'schoolId' })
  school: SchoolEntity;

  @ManyToOne(() => SubjectEntity, (subject) => subject.vacancies, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subjectId' })
  subject: SubjectEntity;

  @OneToMany(() => ApplicationEntity, (application) => application.vacancy)
  applications: ApplicationEntity[];
}
