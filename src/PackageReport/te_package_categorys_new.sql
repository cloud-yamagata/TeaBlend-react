--drop table te_package_categorys_new;
create table te_package_categorys_new
(
 product_no int not null

,temperature text
,humidity text

,packing_start_hh text
,packing_start_mm text
,packing_end_hh text
,packing_end_mm text

,work_before_cleaning_start_hh text
,work_before_cleaning_start_mm text
,work_before_cleaning_end_hh text
,work_before_cleaning_end_mm text
,work_end_cleaning_start_hh text
,work_end_cleaning_start_mm text
,work_end_cleaning_end_hh text
,work_end_cleaning_end_mm text

,hp500_no1_chk boolean
,hp500_no2_chk boolean
,fr2_chk boolean
,fpg_chk boolean
,uba_chk boolean

,lift_cleaning_before_chk boolean
,lift_cleaning_after_chk boolean
,lift_operation_before_chk boolean
,lift_operation_after_chk boolean
,lift_rem_before_chk boolean
,lift_rem_after_chk boolean

,packing_filter_before_chk boolean
,packing_filter_after_chk boolean
,packing_seal_before_chk boolean
,packing_seal_after_chk boolean
,packing_conveyor_before_chk boolean
,packing_conveyor_after_chk boolean
,packing_magnet_before_chk boolean
,packing_magnet_after_chk boolean

,packing_operation_before_chk boolean
,packing_operation_after_chk boolean
,packing_rem_before_chk boolean
,packing_rem_after_chk boolean

,tool_cleaning_before_chk boolean
,tool_cleaning_after_chk boolean
,uba3_cleaning_before_chk boolean
,uba3_cleaning_after_chk boolean

,weight_test_before_chk text
,weight_test_after_chk text

,residual_oxygen_am text
,residual_oxygen_pm text

,weight_no_1 text
,weight_no_2 text
,weight_no_3 text
,weight_no_4 text
,weight_no_5 text

,weight_chk_1 text
,weight_chk_2 text
,weight_chk_3 text
,weight_chk_4 text
,weight_chk_5 text

,remarks text
);

--alter table te_package_categorys drop constraint pk_te_package_categorys;
alter table only te_package_categorys_new add constraint pk_te_package_categorys_new primary key (product_no);