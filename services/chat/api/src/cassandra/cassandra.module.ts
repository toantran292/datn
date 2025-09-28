import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client, mapping } from 'cassandra-driver';

export const CASS_CLIENT = Symbol('CASS_CLIENT');
export const CASS_MAPPER = Symbol('CASS_MAPPER');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CASS_CLIENT,
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => {
        const client = new Client({
          contactPoints: (cfg.get<string>('CASS_CONTACT_POINTS') || '127.0.0.1').split(','),
          localDataCenter: cfg.get<string>('CASS_DC') || 'dc1',
          keyspace: cfg.get<string>('CASS_KEYSPACE') || 'chat',
          protocolOptions: {
            port: Number(cfg.get('CASS_PORT') || 9042),
          },
          credentials: cfg.get('CASS_USERNAME') && cfg.get('CASS_PASSWORD')
            ? { username: cfg.get('CASS_USERNAME')!, password: cfg.get('CASS_PASSWORD')! }
            : undefined,
        });
        await client.connect();
        return client;
      },
    },
    {
      provide: CASS_MAPPER,
      useFactory: (client: Client) => {
        const toCamel = new mapping.UnderscoreCqlToCamelCaseMappings();
        const mappingOptions: mapping.MappingOptions = {
          models: {
            User: {
              tables: ['users'],
              mappings: toCamel,
            },
            Room: {
              tables: ['rooms'],
              mappings: toCamel,
            },
            RoomMember: {
              tables: ['room_members'],
              mappings: toCamel,
            },
            Thread: {
              tables: ['threads'],
              mappings: toCamel,
            },
            Message: {
              tables: ['messages'],
              mappings: toCamel,
            },
          },
        };
        return new mapping.Mapper(client, mappingOptions);
      },
      inject: [CASS_CLIENT],
    },
  ],
  exports: [CASS_CLIENT, CASS_MAPPER],
})
export class CassandraModule { }
