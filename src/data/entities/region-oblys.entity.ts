import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CandidateApplicationLocationEntity } from './candidate-application-location.entity';
import { RegionEntity } from './region.entity';

@Entity({ name: 'region_oblyses' })
export class RegionOblysEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nameKz: string;

  @Column()
  nameRu: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => RegionEntity, (region) => region.oblys)
  regions: RegionEntity[];

  @OneToMany(
    () => CandidateApplicationLocationEntity,
    (location) => location.oblysRef,
  )
  candidateApplicationLocations: CandidateApplicationLocationEntity[];
}
