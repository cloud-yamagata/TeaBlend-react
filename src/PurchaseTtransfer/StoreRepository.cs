using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Data;
using Dapper;

namespace PurchaseTtransfer.Models
{
    public class StoreRepository
    {
        #region リポジトリ保管用
        /// <summary>
        /// リポジトリ保管用
        /// </summary>
        // 仕入実績情報
        private static readonly List<Store> dataStore = new List<Store>();
        // 仕入振分情報
        private static readonly List<SubStore> dataSubStore = new List<SubStore>();
        // 転売先情報
        private static readonly List<Resale> dataResale = new List<Resale>();
        // 転売リスト
        private static readonly List<Store> lstResale = new List<Store>();
        // 有機転売紐づけリスト
        private static readonly List<Store> lstCompare = new List<Store>();
        #endregion

        #region コンストラクタ
        /// <summary>
        /// コンストラクタ
        /// </summary>
        public StoreRepository()
        {
            //StoreAllocationLoad(int.Parse(DateTime.Now.AddMonths(-3).ToString("yy"))); // 仕入情報保管
            //SubStoreAllocationLoad(int.Parse(DateTime.Now.AddMonths(-3).ToString("yy"))); // 仕入振分情報保管
            //ResaleAllocationLoad(); // 転売先情報保管
            //ResaleReporAllocationLoad(); // 転売リスト保管
            //GradeReporAllocationLoad(); // 有機転売紐づけリスト保管
        }
        #endregion

        #region 仕入情報をLOAD
        /// <summary>
        /// 仕入情報をリポジトリへ保管
        /// </summary>
        public void StoreAllocationLoad(int year)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                dataStore.Clear();
                var result = conn.Select<Store>(Properties.Resources.仕入実績情報, new {year = year });
                foreach (Store entity in result)
                {
                    dataStore.Add(this.setPurchase(entity));
                };
            }
        }
        #endregion

        #region 仕入振分情報をLOAD
        /// <summary>
        /// 仕入振分情報をリポジトリへ保管
        /// </summary>
        public void SubStoreAllocationLoad(int year)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                dataSubStore.Clear();
                var result = conn.Select<SubStore>(Properties.Resources.仕入振分情報, new { year = year });
                foreach (SubStore entity in result)
                {
                    dataSubStore.Add(this.setTransfer(entity));
                };
            }
        }
        #endregion

        #region 転売先情報をLOAD
        /// <summary>
        /// 転売先情報をリポジトリへ保管
        /// </summary>
        public void ResaleAllocationLoad()
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    dataResale.Clear();
                    var result = conn.Select<Resale>(Properties.Resources.転売先情報);
                    foreach (Resale entity in result)
                    {
                        dataResale.Add(entity);
                    };
                }
                catch (InvalidOperationException ex)
                {
                    MessageBox.Show(ex.Message);
                    throw;
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.Message);
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 転売リストをLOAD
        /// <summary>
        /// 転売リストをリポジトリへ保管
        /// </summary>
        public void ResaleReporAllocationLoad()
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    lstResale.Clear();
                    var result = conn.Select<Store>(Properties.Resources.転売リスト);
                    foreach (Store entity in result)
                    {
                        lstResale.Add(entity);
                    };
                }
                catch (InvalidOperationException ex)
                {
                    MessageBox.Show(ex.Message);
                    throw;
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.Message);
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 有機転売紐づけリストをLOAD
        /// <summary>
        /// 有機転売紐づけリストをリポジトリへ保管
        /// </summary>
        public void GradeReporAllocationLoad()
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    lstCompare.Clear();
                    var result = conn.Select<Store>(Properties.Resources.有機紐づけリスト);
                    foreach (Store entity in result)
                    {
                        lstCompare.Add(entity);
                    };
                }
                catch (InvalidOperationException ex)
                {
                    MessageBox.Show(ex.Message);
                    throw;
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.Message);
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 初期処理
        /// <summary>
        /// 初期処理
        /// </summary>
        public Store Init()
        {
            return new Store
            {
                year = int.Parse(DateTime.Now.AddMonths(-3).ToString("yy")),
                purchase = "",
                bid_no = "",
                purchase_date = DateTime.Now,
                variety = "",
                tea_life = "",
                grade = "一般",
                tea_type = "",
                tea_rank = "",
                field_no = "",
                producer = "",
                cost = 0,
                unit_weight = 0,
                unit_number = 0,
                fraction_weight = 0,
                fraction_number = 0,
                discount = 0,
                target = "",
                target_plan = "",
                remarks = ""
            };
        }
        #endregion

        #region 初期処理
        /// <summary>
        /// 初期処理
        /// </summary>
        public SubStore SubInit()
        {
            return new SubStore
            {
                year = DateTime.Now.DayOfYear,
                purchase = "",
                bid_no = "",
                result_type = "",
                result_type_name = "",
                transfer = "",
                transfer_date = DateTime.Now,
                unit_weight = 0,
                unit_number = 0,
                fraction_weight = 0,
                fraction_number = 0,
                unit_price = 0,
                transfer_quantity = 0,
                remarks = ""
            };
        }
        #endregion

        #region 仕入実績情報抽出
        /// <summary>
        /// 仕入実績情報情報をリポジトリから抽出し返却
        /// </summary>
        /// <param name="name1">検索文字1</param>
        /// <param name="name2">検索文字2</param>
        /// <param name="name3">検索文字3</param> 
        /// <param name="purchase_date">仕入日</param> 
        /// <param name="inCauseStatus">仕入残量状態</param>
        public List<Store> Load()
        {
            return dataStore;
        }
        public List<Store> LoadResaleList()
        {
            return lstResale;
        }
        public List<Store> LoadCompareList()
        {
            return lstCompare;
        }
        public IEnumerable<Store> LoadSelName(string name1)
        {
            return dataStore
                .Where(x => (x.purchase + x.producer + x.target + x.target_plan + x.bid_no.ToString()).Contains(name1));
        }
        public IEnumerable<Store> LoadSelName(string name1, string name2)
        {
            return dataStore
                .Where(x => (x.purchase + x.producer + x.target + x.target_plan + x.bid_no.ToString()).Contains(name1) &&
                            (x.purchase + x.producer + x.target + x.target_plan + x.bid_no.ToString()).Contains(name2));
        }
        public IEnumerable<Store> LoadSelName(string name1, string name2, string name3)
        {
            return dataStore
                .Where(x => (x.purchase + x.producer + x.target + x.target_plan + x.bid_no.ToString()).Contains(name1) &&
                            (x.purchase + x.producer + x.target + x.target_plan + x.bid_no.ToString()).Contains(name2) &&
                            (x.purchase + x.producer + x.target + x.target_plan + x.bid_no.ToString()).Contains(name3));
        }
        public IEnumerable<Store> Load(DateTime purchase_date)
        {
            return dataStore
                .OrderBy(x => x.year)
                .ThenBy(x => x.purchase)
                .ThenBy(x => x.bid_no)
                .Where(x => x.purchase_date == purchase_date);
        }
        public IEnumerable<Store> LoadStatus(List<string> inCauseStatus)
        {
            return dataStore
                .Where(x => inCauseStatus.Contains(x.status));
        }
        public IEnumerable<Store> LoadNoPlan()
        {
            return dataStore
                .Where(x => String.IsNullOrWhiteSpace(x.target));
        }
        public IEnumerable<Store> GetMaterialRejisLoad()
        {
            return dataStore
                .Where(x => x.IsSelected);
        }
        public IEnumerable<Store> GetMaterialSelected()
        {
            return dataStore
                .Where(x => x.IsUpdateSel);
        }
        public IEnumerable<Store> OkMaterialRejisLoad()
        {
            return dataStore
                .Where(x => x.is_chk_usable);
        }
        /// <summary>
        ///  原料の在庫チェック
        /// <param name="item_no">原料茶の商品No</param>
        /// <param name="product_no">製造No</param>
        /// </summary>
        public bool isSelected()
        {
            return dataStore.Where(x => x.IsUpdateSel).Any();
        }
        #endregion

        #region 年度切替
        /// <summary>
        /// 指定年度の仕入実績情報リポジトリを再保管する
        /// </summary>
        /// <param name="year">年度</param>
        public void Reload(int year)
        {
            //StoreAllocationLoad(int.Parse(DateTime.Now.AddMonths(-3).ToString("yy"))); // 仕入情報保管
            //SubStoreAllocationLoad(int.Parse(DateTime.Now.AddMonths(-3).ToString("yy"))); // 仕入振分情報保管
            //ResaleAllocationLoad(); // 転売先情報保管
            //ResaleReporAllocationLoad(); // 転売リスト保管
            //GradeReporAllocationLoad(); // 有機転売紐づけリスト保管
            StoreAllocationLoad(year);　// 仕入情報保管
            SubStoreAllocationLoad(year); // 仕入振分情報保管
            ResaleAllocationLoad(); // 転売先情報保管
            ResaleReporAllocationLoad(); // 有機転売紐づけリスト保管
            GradeReporAllocationLoad(); // 有機転売紐づけリスト保管
        }
        #endregion

        #region 仕入振分情報抽出
        /// <summary>
        /// 仕入振分情報をリポジトリから抽出し返却
        /// </summary>
        /// <param name="year">年度</param>
        /// <param name="purchase">仕入先</param>
        /// <param name="year">入札No</param>
        public IEnumerable<SubStore> LoadSub(int year, string purchase, string bid_no)
        {
            return dataSubStore
                .OrderBy(x => x.result_type)
                .ThenByDescending(x => x.transfer)
                .Where(x => x.year == year && x.purchase == purchase && x.bid_no == bid_no);
        }
        #endregion

        #region 仕入情報検索
        /// <summary>
        /// 仕入情報をリポジトリから検索し返却
        /// </summary>
        /// <param name="year">年度</param>
        /// <param name="purchase">仕入先</param>
        /// <param name="year">入札No</param>
        public Store Find(int year, string purchase, string bid_no)
        {
            var target = dataStore
              .Where(x => x.year == year && x.purchase.Equals(purchase) && x.bid_no.Equals(bid_no))
              .FirstOrDefault();

            if (target == null)
            {
                return null;
            }

            return target;
        }
        #endregion

        #region 仕入振分情報検索
        /// <summary>
        /// 仕入振分情報をリポジトリから検索し返却
        /// </summary>
        /// <param name="year">年度</param>
        /// <param name="purchase">仕入先</param>
        /// <param name="year">入札No</param>
        /// <param name="result_type">振分区分</param>
        public SubStore FindTransfer(int year, string purchase, string bid_no, string result_type)
        {
            var target = dataSubStore
              .Where(x => x.year == year && x.purchase.Equals(purchase) && x.bid_no.Equals(bid_no) && x.result_type.Equals(result_type))
              .FirstOrDefault();

            if (target == null)
            {
                return null;
            }

            return target;
        }
        public SubStore FindTransfer(int year, string purchase, string bid_no, string result_type, string transfer)
        {
            var target = dataSubStore
              .Where(x => x.year == year && x.purchase.Equals(purchase) && x.bid_no.Equals(bid_no) && x.result_type.Equals(result_type) && x.transfer.Equals(transfer))
              .FirstOrDefault();

            if (target == null)
            {
                return null;
            }

            return target;
        }
        #endregion

        #region 仕入振分情報検索
        /// <summary>
        /// 仕入振分情報をリポジトリから検索し返却
        /// </summary>
        /// <param name="year">年度</param>
        /// <param name="purchase">仕入先</param>
        /// <param name="year">入札No</param>
        /// <param name="result_type">振分区分</param>
        public SubStore FindTransferPrimary(int year, string purchase, string bid_no, string result_type, string transfer)
        {
            var target = dataSubStore
              .Where(x => x.year == year && x.purchase.Equals(purchase) && x.bid_no.Equals(bid_no) && x.result_type.Equals(result_type) && x.transfer.Equals(transfer))
              .FirstOrDefault();

            if (target == null)
            {
                return null;
            }

            return target;
        }
        #endregion

        #region 仕入情報登録
        /// <summary>
        /// 仕入情報の登録
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void Regist(Store entity)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    int count = conn.Connection.Execute(Properties.Resources.仕入情報登録
                    , new
                    {
                        year = entity.year,
                        purchase = entity.purchase,
                        bid_no = entity.bid_no,
                        purchase_date = entity.purchase_date,
                        variety = entity.variety,
                        tea_life = entity.tea_life,
                        grade = entity.grade,
                        tea_type = entity.tea_type,
                        tea_rank = entity.tea_rank,
                        field_no = entity.field_no,
                        producer = entity.producer,
                        cost = entity.cost,
                        unit_weight = entity.unit_weight,
                        unit_number = entity.unit_number,
                        fraction_weight = entity.fraction_weight,
                        fraction_number = entity.fraction_number,
                        yield = entity.discount,
                        target = entity.target,
                        target_plan = entity.target_plan,
                        lot_no = entity.lot_no,
                        remarks = entity.remarks,
                    });
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch (Exception)
                {
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 仕入情報更新
        /// <summary>
        /// 仕入情報の更新
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void Update(Store entity)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    int count = conn.Connection.Execute(Properties.Resources.仕入情報更新
                    , new
                    {
                        year = entity.year,
                        purchase = entity.purchase,
                        bid_no = entity.bid_no,
                        purchase_date = entity.purchase_date,
                        variety = entity.variety,
                        tea_life = entity.tea_life,
                        grade = entity.grade,
                        tea_type = entity.tea_type,
                        tea_rank = entity.tea_rank,
                        field_no = entity.field_no,
                        producer = entity.producer,
                        cost = entity.cost,
                        unit_weight = entity.unit_weight,
                        unit_number = entity.unit_number,
                        fraction_weight = entity.fraction_weight,
                        fraction_number = entity.fraction_number,
                        discount = entity.discount,
                        target = entity.target,
                        target_plan = entity.target_plan,
                        lot_no = entity.lot_no,
                        remarks = entity.remarks,
                    });
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch (Exception)
                {
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 仕入情報更新
        /// <summary>
        /// 仕入情報の更新
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void UpdateAll(Store entity)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    int count = conn.Connection.Execute(Properties.Resources.仕入実績一括更新
                    , new
                    {
                        year = entity.year,
                        purchase = entity.purchase,
                        bid_no = entity.bid_no,
                        purchase_date = entity.purchase_date,
                        variety = entity.variety,
                        tea_life = entity.tea_life,
                        grade = entity.grade,
                        tea_type = entity.tea_type,
                        tea_rank = entity.tea_rank,
                        field_no = entity.field_no,
                        producer = entity.producer,
                        cost = entity.cost,
                        unit_weight = entity.unit_weight,
                        unit_number = entity.unit_number,
                        fraction_weight = entity.fraction_weight,
                        fraction_number = entity.fraction_number,
                        discount = entity.discount,
                        target = entity.target,
                        target_plan = entity.target_plan,
                        lot_no = entity.lot_no,
                        remarks = entity.remarks,
                    });
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch (Exception)
                {
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 仕入情報削除
        /// <summary>
        /// 仕入情報の削除
        /// <param name="year">年度</param>
        /// <param name="purchase">仕入先</param>
        /// <param name="year">入札No</param>
        /// </summary>
        public void Delete(int year, string purchase, string bid_no)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    int count = conn.Connection.Execute(Properties.Resources.仕入情報削除
                    , new
                    {
                        year = year,
                        purchase = purchase,
                        bid_no = bid_no
                    });
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch (Exception)
                {
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 仕入振分情報登録&変更
        /// <summary>
        /// 仕入振分情報の登録及び変更
        /// <param name="entity">仕入情報クラス</param>
        /// <param name="unit_number">梱包本数</param>
        /// <param name="fraction_number">端数本数</param>
        /// </summary>
        public void TransferRegist(SubStore entity)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    int count = conn.Connection.Execute(Properties.Resources.仕入振分実績登録
                    , new
                    {
                        year = entity.year,
                        purchase = entity.purchase,
                        bid_no = entity.bid_no,
                        transfer_date = entity.transfer_date,
                        transfer = entity.transfer,
                        result_type = entity.result_type,
                        unit_weight = entity.unit_number == 0 ? 0 : entity.unit_weight,
                        unit_number = entity.unit_number,
                        fraction_weight = entity.fraction_number == 0 ? 0 : entity.fraction_weight,
                        fraction_number = entity.fraction_number,
                        unit_price = entity.unit_price,
                        remarks = ""
                    });
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch (Exception)
                {
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 仕入振分情報削除
        /// <summary>
        /// 仕入振分情報の削除
        /// <param name="entity">仕入情報クラス</param>
        /// <param name="unit_number">梱包本数</param>
        /// <param name="fraction_number">端数本数</param>
        /// </summary>
        public void TransferDelete(SubStore entity)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    int count = conn.Connection.Execute(Properties.Resources.仕入振分実績削除
                    , new
                    {
                        year = entity.year,
                        purchase = entity.purchase,
                        bid_no = entity.bid_no,
                        transfer_date = entity.transfer_date,
                        result_type = entity.result_type,
                        transfer = entity.transfer,
                    });
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch (Exception)
                {
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 仕入情報編集
        /// <summary>
        /// 仕入情報を返却
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public Store setPurchase(Store entity)
        {
            #region 仕入情報編集
            return new Store
            {
                year = entity.year,
                purchase = entity.purchase,
                bid_no = entity.bid_no,
                purchase_date = entity.purchase_date,
                variety = entity.variety,
                tea_life = entity.tea_life,
                grade = entity.grade,
                tea_type = entity.tea_type,
                tea_rank = entity.tea_rank,
                field_no = entity.field_no,
                producer = entity.producer,
                cost = entity.cost,
                unit_weight = entity.unit_weight,
                unit_number = entity.unit_number,
                fraction_weight = entity.fraction_weight,
                fraction_number = entity.fraction_number,
                discount = entity.discount,
                target = entity.target,
                target_plan = entity.target_plan,
                lot_no = entity.lot_no,
                remarks = entity.remarks,
                transfer = entity.transfer,
                transfer_weight = entity.transfer_weight,
                status = entity.status,
                is_chk_usable = entity.is_chk_usable,
            };
            #endregion
        }
        #endregion

        #region 仕入原料登録
        /// <summary>
        /// 仕入原料の登録
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void MaterialRegist(Store entity)
        {
            using (PostgreSqlConnect conn = new PostgreSqlConnect())
            {
                try
                {
                    // トランザクション開始
                    conn.BeginTransaction();

                    string organic_class = ""
                        ;
                    if (entity.grade.Equals("有機")) organic_class = "A";
                    else if (entity.grade.Equals("無農薬")) organic_class = "B";
                    else if (entity.grade.Equals("一般")) organic_class = "C";

                    string material_name = "";
                    material_name = "(" + entity.year + ")";
                    if (entity.purchase.Equals("岡村製茶")) material_name += "岡";
                    if (entity.purchase.Equals("三州製茶")) material_name += "三";
                    if (entity.purchase.Equals("池田製茶")) material_name += "池";
                    if (entity.purchase.Equals("沢田園")) material_name += "沢";
                    if (entity.purchase.Equals("堀口園")) material_name += "堀";
                    material_name += entity.bid_no;
                    material_name += entity.producer;
                    material_name += entity.tea_life;
                    material_name += entity.grade.Equals("一般") ? "" : entity.grade;
                    material_name += entity.variety;
                    material_name += entity.tea_type.Equals("煎茶") ? "" :  entity.tea_type;
                    material_name += entity.tea_rank.Equals("本茶") ? "" : entity.tea_rank;

                    var target = this.FindTransfer(entity.year, entity.purchase, entity.bid_no, "1" );

                    int count = conn.Connection.Execute(Properties.Resources.仕入原料登録
                    , new
                    {
                        year = entity.year,
                        purchase = entity.purchase,
                        purchase_no = entity.bid_no,
                        purchase_date = entity.purchase_date,
                        variety = entity.variety,
                        tea_life = entity.tea_life,
                        organic_class = organic_class,
                        tea_type = entity.tea_type,
                        tea_rank = entity.tea_rank,
                        field_no = entity.field_no,
                        producer = entity.producer,
                        cost = entity.cost,
                        material_name = material_name,
                        unit_weight = target.unit_number == 0 ? 0 : target.unit_weight,
                        unit_number = target.unit_number,
                        fraction_weight = target.fraction_number == 0 ? 0 : target.fraction_weight,
                        fraction_number = target.fraction_number,
                        remarks = entity.remarks,
                    });

                    int serial_no = conn.Connection.Query<int>(Properties.Resources.原料NOシーケンス取得).SingleOrDefault();

                    count = conn.Connection.Execute(Properties.Resources.入出庫情報登録
                    , new
                    {
                        transfer_date = target.transfer_date,
                        lot_no = serial_no,
                        process_type = "01",
                        product_no = serial_no,
                        lot_name = material_name,
                        transfer_type = "1",
                        result_type = "1",
                        lot_type = "1",
                        reason = "荒茶原料登録",
                        unit_weight = target.unit_number == 0 ? 0 : target.unit_weight,
                        unit_number = target.unit_number,
                        fraction_weight = target.fraction_number == 0 ? 0 : target.fraction_weight,
                        fraction_number = target.fraction_number,
                        transfer_quantity = target.unit_weight * target.unit_number + target.fraction_weight * target.fraction_number,
                        unit_type = "Kg",
                        remarks = ""
                    });

                    // コミット
                    conn.CommitTransaction();
                }
                catch (InvalidOperationException)
                {
                    // ロールバック
                    conn.RollBackTransaction();
                    throw;
                }
                catch (Exception)
                {
                    // ロールバック
                    conn.RollBackTransaction();
                    throw;
                }
                finally
                {
                    conn.ConnectionClose();
                }
            }
        }
        #endregion

        #region 振分情報編集
        /// <summary>
        /// 振分情報を返却
        /// <param name="entity">振分情報クラス</param>
        /// </summary>
        public SubStore setTransfer(SubStore entity)
        {
            #region 振分情報編集
            return new SubStore
            {
                year = entity.year,
                purchase = entity.purchase,
                bid_no = entity.bid_no,
                result_type = entity.result_type,
                result_type_name = entity.result_type_name,
                transfer = entity.transfer,
                transfer_date = entity.transfer_date ?? DateTime.Now,
                unit_weight = entity.unit_weight,
                unit_number = entity.unit_number,
                fraction_weight = entity.fraction_weight,
                fraction_number = entity.fraction_number,
                unit_price = entity.unit_price,
                remarks = entity.remarks,
            };
            #endregion
        }
        #endregion

        #region 仕入情報登録
        /// <summary>
        /// 仕入情報の登録
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void RegistStore(Store entity)
        {
            dataStore.Add(entity);
        }
        #endregion

        #region 仕入振分情報登録
        /// <summary>
        /// 仕入振分情報の登録
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void RegistSubStore(SubStore entity)
        {
            dataSubStore.Add(entity);
        }
        #endregion

        #region 仕入情報削除
        /// <summary>
        /// 仕入情報削除
        /// <param name="entity">仕入情報クラス</param>
        /// </summary>
        public void RemoveStore(Store entity)
        {
            dataStore.Remove(entity);
        }
        #endregion

        #region 仕入振分情報削除
        /// <summary>
        /// 仕入振分情報削除
        /// <param name="entity">仕入振分情報クラス</param>
        /// </summary>
        public void RemoveSubStore(SubStore entity)
        {
            dataSubStore.Remove(entity);
        }
        #endregion

        #region 転売先の提供単価を返却
        /// <summary>
        /// 転売先と単価を指定し提供単価を返却
        /// <param name="transfer">転売先</param>
        /// <param name="cost">単価</param>
        /// </summary>
        public Decimal GetUnitPrice(string transfer, int cost, decimal discount)
        {
            var target = dataResale
              .Where(x => x.resale == transfer)
              .FirstOrDefault();

            if (target == null)
            {
                return cost;
            }

            switch (target.calc_type)
            {
                case 0: //数量粉引
                    if (cost > target.limit_price)
                    {

                        // 小数点第一位で四捨五入し、整数で出力
                        return Math.Round((Decimal)cost * ((Decimal)target.rate / 100m), 0, MidpointRounding.AwayFromZero) + target.postage;
                    }
                    else
                    {
                        return target.fixed_price + target.postage;
                    }
                case 1: //単価粉引
                        //return Math.Round((Decimal)(cost * (1m - (Decimal)discount)), 0, MidpointRounding.AwayFromZero) + target.postage;
                        return Math.Round((Decimal)(cost * (1 - discount / 100)), 0, MidpointRounding.AwayFromZero) + target.postage + target.fixed_price;
                case 2: //直販
                    return 0;
                case 3: //堀口園_棒
                        //return Math.Round((Decimal)(cost * ((Decimal)target.rate / 100m) * (1m - (Decimal)discount)), 1, MidpointRounding.AwayFromZero) + target.postage;
                        return Math.Round((Decimal)(cost * ((Decimal)target.rate / 100m) * (1 - discount / 100)), 1, MidpointRounding.AwayFromZero) + target.postage;
                default:
                    return cost;
            }
        }
        #endregion

    }
}
