import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseType } from './entities/expense-type.entity';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExpenseType, Expense]),
        KeycloakModule,
    ],
    controllers: [ExpensesController],
    providers: [ExpensesService],
    exports: [ExpensesService],
})
export class ExpensesModule {}
