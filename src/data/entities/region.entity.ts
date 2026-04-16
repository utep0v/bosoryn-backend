import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolEntity } from './school.entity';
import { VacancyEntity } from './vacancy.entity';
import { RegionOblysEntity } from './region-oblys.entity';

@Entity({ name: 'regions' })
export class RegionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  oblysId: string | null;

  @Column()
  nameKz: string;

  @Column()
  nameRu: string;

  @Column({ type: 'varchar', nullable: true })
  type: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => RegionOblysEntity, (oblys) => oblys.regions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'oblysId' })
  oblys: RegionOblysEntity | null;

  @OneToMany(() => SchoolEntity, (school) => school.region)
  schools: SchoolEntity[];

  @OneToMany(() => VacancyEntity, (vacancy) => vacancy.region)
  vacancies: VacancyEntity[];
}
