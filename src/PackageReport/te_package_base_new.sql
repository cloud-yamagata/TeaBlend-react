drop table te_package_base_new;
create table te_package_base_new
(
 product_no serial not null
,lot_status char(1) not null
,organic_class char(1) not null
,item_no int not null
,product_name text not null
,work_date date not null
,complete_quantity int not null
,sample_quantity int not null
,fail_quantity int not null
,use_tea_no int
,part_name text
,remarks text
,lot_part_info jsonb
);

--alter table te_package_base drop constraint pk_te_package_base;
alter table only te_package_base_new add constraint pk_te_package_base_new primary key (product_no);

comment on table te_package_base_new is 'パッケージ基本情報';
comment on column te_package_base_new.product_no is '製造NO';
comment on column te_package_base_new.lot_status is 'ロット状態';
comment on column te_package_base_new.organic_class is '有機区分';
comment on column te_package_base_new.item_no is '商品NO';
comment on column te_package_base_new.product_name is '製造名';
comment on column te_package_base_new.work_date is '作業日';
comment on column te_package_base_new.complete_quantity is '生産量';
comment on column te_package_base_new.sample_quantity is '保管サンプル';
comment on column te_package_base_new.fail_quantity is '不良数';
comment on column te_package_base_new.use_tea_no is '使用茶NO';
comment on column te_package_base_new.part_name is '原料名';
comment on column te_package_base_new.remarks is '摘要';
comment on column te_package_base_new.lot_part_info is '使用部品情報';