import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RegionEntity } from './region.entity';
import { VacancyEntity } from './vacancy.entity';

@Entity({ name: 'schools' })
export class SchoolEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column('uuid')
  regionId: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => RegionEntity, (region) => region.schools, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'regionId' })
  region: RegionEntity;

  @OneToMany(() => VacancyEntity, (vacancy) => vacancy.school)
  vacancies: VacancyEntity[];
}
