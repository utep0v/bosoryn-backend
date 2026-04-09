import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SchoolEntity } from './school.entity';
import { VacancyEntity } from './vacancy.entity';

@Entity({ name: 'regions' })
export class RegionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nameKz: string;

  @Column()
  nameRu: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => SchoolEntity, (school) => school.region)
  schools: SchoolEntity[];

  @OneToMany(() => VacancyEntity, (vacancy) => vacancy.region)
  vacancies: VacancyEntity[];
}
