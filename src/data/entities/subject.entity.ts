import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VacancyEntity } from './vacancy.entity';

@Entity({ name: 'subjects' })
export class SubjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nameKz: string;

  @Column()
  nameRu: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => VacancyEntity, (vacancy) => vacancy.subject)
  vacancies: VacancyEntity[];
}
