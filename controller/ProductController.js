var passport = require("passport");
var ProductType = require("../models/ProductTypes");
var jwt = require("jsonwebtoken");
let request = require("request-promise");
let base64 = require("base-64");
let mongoose = require("mongoose");
let handleAccountJwt = require("../handleAccountJwt");
let fs = require("fs");
const path = require("path");
let api = require("../config");
API_URL = api.API_URL;
const formidable = require("formidable");

function objectIsEmpty(object) {
  if (Object.keys(object).length == 0) {
    return true;
  }
  return false;
}
exports.getListProductType = async (req, res) => {
  try {
    if(!req.session.isLogin){
      return res.render('login/login');
    }
    let page = 0; //req.body.page
    let limit = 1; //req.body.limit
    const listProductType = await ProductType.find()
      .skip(page * limit)
      .limit(limit);
    const listAll = await ProductType.find();
    // const listAll = await ProductType.find().skip(page * limit).limit(limit)
    const countPage = parseInt((await listAll).length / limit);
    return res.render("product/ProductType", {
      user : req.session.user,
      listProductType,
      mgs: "",
      countPage: countPage,
    });
  } catch (error) {
    return res.send({ mgs: "Có lỗi xảy ra! Lấy danh sách thất bại" });
  }
};
exports.getListPageType = async (req, res) => {
  try {
    if(!req.session.isLogin){
      return res.render('login/login');
    }
    let page = req.body.page;
    let limit = parseInt(req.body.limit);
    const listAll = ProductType.find({});
    let listProductType = await ProductType.find()
      .skip(page * limit)
      .limit(limit);
    const countPage = parseInt((await listAll).length / limit);
    return res.json({
      success: true,
      listProductType: listProductType,
      mgs: "Ahihi ",
      countPage: countPage,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      mgs: "Có lỗi xảy ra! Lấy danh sách thất bại",
    });
  }
};
exports.getProductTypeById = async (req, res) => {
  try {
    if(!req.session.isLogin){
      return res.render('login/login');
    }
    let typeId = req.body.typeId
    if (typeId === null || typeId === undefined) {
      return res.json({
        status: -1,
        message: 'Vui lòng nhập ID loại cần tìm',
        data: null
      })
    }
    const productTypes = await ProductType.findOne(
      { _id: typeId }
    )
    if (productTypes !== null) {
      return res.json({
        success: true,
        productType: productTypes,
        mgs: "Lấy loại sản phẩm thành công ",
      })
    } else {
      return res.json({
        success: false,
        productType: null,
        mgs: "Không có loại sản phẩm này",
      })
    }
  } catch{
    return res.json({
      success: false,
      productType: null,
      mgs: "Có lỗi xảy ra! Không lấy được loại sản phẩm",
    })
  }
}
exports.addProductType1 = async (req, res) => {
  if(!req.session.isLogin){
    return res.render('login/login');
  }
  let typeName = req.body.typeName;
  let description = req.body.description;
  let date = new Date();
  let today = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  if (typeName == null || typeName == undefined || typeName == "") {
    return res.json({ success: false, mgs: "Tên loại không được để trống" });
  }
  try {
    const check = await ProductType.findOne({
      typeName: typeName,
    });
    if (check == null) {
      let files = req.files;
      if (!objectIsEmpty(files)) {
        let file = req.files.imgType;
        let imageName = file.fieldName + "-" + Date.now() + ".png";
        let tmp_path = file.path;
        let target_path =
          __dirname.replace("controller", "") +
          "public/img/proType/" +
          imageName;
        let src = fs.createReadStream(tmp_path);
        let dest = fs.createWriteStream(target_path);
        src.pipe(dest);
        src.on("end", async () => {
          try {
            let typeImg = "img/proType/" + imageName;
            const newProductType = new ProductType({
              _id: new mongoose.Types.ObjectId(),
              typeName: typeName,
              typeImg: typeImg,
              description: description,
              created_at: today,
              last_modified: today,
            });
            await newProductType.save().then(async () => {
              return res.json({
                success: true,
                mgs: "Thêm loại sản phẩm thành công",
              });
            });
          } catch (error) {
            return res.json({
              success: false,
              mgs: "Có sự cố xảy ra. Không thể thêm loại sản phẩm!",
            });
          }
        });
        src.on("error", (err) => {
          fs.unlink(tmp_path, (err) => {
            console.log(err);
          });
          return res.json({
            status: -1,
            message: "Thất bại",
          });
        });
      } else {
        let typeImg = "img/proType/default.png";
        //create new ProductType
        const newProductType = new ProductType({
          _id: new mongoose.Types.ObjectId(),
          typeName: typeName,
          typeImg: typeImg,
          description: description,
          created_at: today,
          last_modified: today,
        });
        await newProductType.save().then(async () => {
          return res.json({ success: true, mgs: "Thêm sản phẩm thành công" });
        });
      }
    } else {
      return res.json({
        success: false,
        mgs: "Tên loại sản phẩm đã tồn tại!",
      });
    }
  } catch {
    return res.json({
      success: false,
      mgs: "Có sự cố xảy ra. Không thể thêm loại sản phẩm!",
    });
  }
};
exports.editProductType = async (req, res) => {
  if(!req.session.isLogin){
    return res.render('login/login');
  }
  let typeId = req.body.typeId;
  let typeName = req.body.typeName;
  let description = req.body.description;
  let date = new Date();
  let today = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  if (typeName == null || typeName == undefined || typeName == "") {
    return res.json({ success: false, mgs: "Tên loại không được để trống" });
  }
  try {
    //Check ProductType Name exit
    const check = await ProductType.findOne({
      _id: typeId,
    });
    let currenImg = check.typeImg;
    let currenName = check.typeName;
    if (typeName !== currenName) {
      const checkName = await ProductType.find({
        typeName: typeName,
      });
      if (checkName.length != 0) {
        return res.json({
          success: false,
          mgs: "Tên loại sản phẩm đã tồn tại!",
        });
      }
    }

    //update ProductType
    let files = req.files;
    if (!objectIsEmpty(files)) {
      let file = req.files.imgType;
      let imageName = file.fieldName + "-" + Date.now() + ".png";
      let tmp_path = file.path;
      let target_path =
        __dirname.replace("controller", "") + "public/img/proType/" + imageName;
      let src = fs.createReadStream(tmp_path);
      let dest = fs.createWriteStream(target_path);
      src.pipe(dest);
      src.on("end", async () => {
        try {
          let typeImg = "img/proType/" + imageName;
          await ProductType.findOneAndUpdate(
            { _id: typeId },
            {
              typeName: typeName,
              typeImg: typeImg,
              description: description,
              last_modified: today,
            }
          ).then(async () => {
            fs.unlink(
              __dirname.replace("controller", "") + "public/" + currenImg,
              (err) => {
                console.log(err);
              }
            );
            return res.json({
              success: true,
              mgs: "Cập nhật loại sản phẩm thành công",
            });
          });
        } catch (error) {
          return res.json({
            success: false,
            mgs: "Có sự cố xảy ra. Không thể thêm loại sản phẩm!",
          });
        }
      });
      src.on("error", (err) => {
        fs.unlink(tmp_path, (err) => {
          console.log(err);
        });
        return res.json({
          status: -1,
          message: "Thất bại",
        });
      });
    } else {
      //create new ProductType
      await ProductType.findOneAndUpdate(
        { _id: typeId },
        {
          typeName: typeName,
          description: description,
          last_modified: today,
        }
      ).then(async () => {
        return res.json({
          success: true,
          mgs: "Cập nhật loại sản phẩm thành công",
        });
      });
    }
  } catch {
    return res.json({
      success: false,
      mgs: "Có sự cố xảy ra. Không thể cập nhật loại sản phẩm!",
    });
  }
};
exports.deleteProductType = async (req, res) => {
  if(!req.session.isLogin){
    return res.render('login/login');
  }
  //Type infor
  try {
    let typeId = req.body.typeId;
    let date = new Date();
    let today = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    await ProductType.findOneAndUpdate(
      { _id: typeId },
      {
        delete_at: today,
        last_modified: today,
      }
    );
    return res.json({
      success: true,
      mgs: "Xoá thành công",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      mgs: "Có lỗi xảy ra! Xoá thất bại",
    });
  }
};
//Product

exports.getListProduct = async (req, res) => {
  try {
    if(!req.session.isLogin){
      return res.render('login/login');
    }
    const listProductType = await ProductType.find({ delete_at: null });
    const listProduct = [];

    // var listProduct = [];
    for (let ProType of listProductType) {
      if (ProType.product !== []) {
        for (let Product of ProType.product) {
          if (Product.delete_at == null) {
            listProduct.push(Product);
          }
        }
      }
    }
    console.log(listProduct);
    return res.render("product/Product", {
      user : req.session.user,
      listProduct,
      listProductType,
      mgs: "",
    });
  } catch (error) {
    return res.send("Có lỗi xảy ra! Lấy danh sách sản phẩm thất bại");
  }
};
exports.addProduct = async (req, res) => {
  if(!req.session.isLogin){
    return res.render('login/login');
  }
  let productType = req.body.productType;
  let description = req.body.description;
  let productName = req.body.productName;
  let unit = req.body.unit;
  let quan = req.body.quan;
  let price = req.body.price;
  let date = new Date();
  let today = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  if (productName == null || productName == undefined || productName == "") {
    return res.json({
      success: false,
      mgs: "Tên sản phẩm không được để trống",
    });
  }
  try {
    const listProductType = await ProductType.find();
    for (let ProType of listProductType) {
      if (ProType.product !== "") {
        for (let Product of ProType.product) {
          if (Product.productName == productName) {
            return res.json({
              success: false,
              mgs: "Sản phẩm đã tồn tại",
            });
          }
        }
      }
    }
    let files = req.files;
    if (!objectIsEmpty(files)) {
      let file = files.imgProduct;
      let imageName = file.fieldName + "-" + Date.now() + ".png";
      let tmp_path = file.path;
      let target_path =
        __dirname.replace("controller", "") + "public/img/product/" + imageName;

      let src = fs.createReadStream(tmp_path);
      let dest = fs.createWriteStream(target_path);
      src.pipe(dest);

      src.on("end", async () => {
        let productImg = "img/product/" + imageName;
        const newProduct = {
          _id: new mongoose.Types.ObjectId(),
          productName: productName,
          unit: unit,
          quan: quan,
          price: price,
          productType: productType,
          productImg: productImg,
          description: description,
          created_at: today,
          last_modified: today,
        };
        console.log("ssssssssssssssssssssss", newProduct);

        const type = await ProductType.findOneAndUpdate(
          {
            typeName: productType,
          },
          {
            $push: { product: newProduct },
          }
        ).then(() => {
          return res.json({
            success: true,
            mgs: "Thêm sản phẩm thành công",
          });
        });
      });
      src.on("error", (err) => {
        fs.unlink(tmp_path, (err) => {
          console.log(err);
        });
        return res.json({
          status: -1,
          message: "Thất bại",
        });
      });
    } else {
      let productImg = "img/product/default.png";
      //create new Product
      const newProduct = {
        _id: new mongoose.Types.ObjectId(),
        productName: productName,
        unit: unit,
        quan: quan,
        price: price,
        productType: productType,
        productImg: productImg,
        description: description,
        created_at: today,
        last_modified: today,
      };
      console.log("productType", productType);

      const type = await ProductType.findOneAndUpdate(
        {
          typeName: productType,
        },
        {
          $push: { product: newProduct },
        }
      ).then((data) => {
        if (data != null) {
          return res.json({
            success: true,
            mgs: "Thêm sản phẩm thành công",
          });
        }
        return res.json({
          success: false,
          mgs: "Thêm sản phẩm thất bại",
        });
      });
    }
  } catch (er) {
    console.log(er);
    return res.json({
      success: false,
      mgs: "Có sự cố xảy ra. Không thể thêm sản phẩm!",
    });
  }
};

exports.editProduct = async (req, res) => {
  let {
    productId,
    productName,
    typeName,
    description,
    quan,
    price,
    unit,
  } = req.body;
  if(!req.session.isLogin){
    return res.render('login/login');
  }
  let date = new Date();
  let today = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  if (!productName) {
    return res.json({ success: false, mgs: "Tên không được để trống" });
  }
  try {
    //find productType have product we need
    const productType = await ProductType.findOne({
      "product._id": productId, //get column productId
    });
    const product = productType.product.filter(
      (data) => data._id.toString() === productId.toString()
    );
    let currenImg = product[0].productImg;
    // Tìm loại sản phẩm có chứa sản phẩm trùng với tên mfinh cập nhật
    const checkName = await ProductType.findOne({
      "product.productName": productName,
    });
    // Nếu có loại này thì có 2 khả năng xảy ra
    // 1 là nó là sản phẩm có id khác
    // 2 nó là sản phẩm mà mình đang cập nhật nhưng không đổi tên mới
    if (checkName !== null) {
      //Lấy sản phẩm có tên trùng ra
      const productCheck = checkName.product.filter(
        (data) => data.productName.toString() === productName.toString()
      );
      if (productCheck[0]._id != productId) {
        //In the case: not update product name
        return res.json({
          success: false,
          mgs: "Tên sản phẩm bị trùng!",
        });
      }
    }

    //Get index of product in product type
    const productIndex = productType.product.findIndex(
      (data) => data._id.toString() === productId.toString()
    );
    console.log(productId);

    //update Product
    let files = req.files;
    if (!objectIsEmpty(files)) {
      //lấy file ảnh
      // let file = req.files.inputImg;
      let file = req.files.imgProduct;
      //đổi tên ảnh bằng ngày tháng
      let imageName = file.fieldName + "-" + Date.now() + ".png";
      // lấy dường dẫn tới file ảnh trong máy
      let tmp_path = file.path;
      // tạo đường dẫn tới thư mục mới
      let target_path =
        __dirname.replace("controller", "") + "public/img/product/" + imageName;
      //đọc file từ đường dẫn cũ
      let src = fs.createReadStream(tmp_path);
      //tạo file ra đường dẫn mới
      let dest = fs.createWriteStream(target_path);
      //láy file từ đường dẫn cũ lưu vào đường dẫn mới
      //đừng hỏi tao, thư viện nó bảo làm thế thì tao làm theo chứ chắc éo gì đã hiểu
      src.pipe(dest);
      //lưu thành công
      src.on("end", async () => {
        //tạo biến ghi đường dẫn ảnh
        let productImg = "img/product/" + imageName;
        //tạo biến lưu những gái trị mới của sản phẩm
        const newProduct = {
          productName: productName,
          unit: unit,
          quan: quan,
          price: price,
          productType: typeName,
          productImg: productImg,
          description: description,
          created_at: today,
          last_modified: today,
        };
        //Tìm tới loại sản phẩm, tìm tới sản phẩm có index bằng cái index mình đã tìm, dùng $set để cập nhật lại
        await productType
          .updateOne({
            $set: { [`product.${productIndex}`]: newProduct },
          })
          .then(async () => {
            if (productImg != "img/product/default.png") {
              fs.unlink(
                __dirname.replace("controller", "") + "public/" + currenImg,
                (err) => {
                  console.log(err);
                }
              );
              return res.json({
                success: true,
                mgs: "Cập nhật loại sản phẩm thành công",
              });
            }
          });
      });
      src.on("error", (err) => {
        fs.unlink(tmp_path, (err) => {
          console.log(err);
        });
        return res.json({
          status: -1,
          message: "Thất bại",
        });
      });
    } else {
      //tạo biến ghi đường dẫn ảnh
      //tạo biến lưu những gái trị mới của sản phẩm
      const newProduct = {
        productName: productName,
        unit: unit,
        quan: quan,
        price: price,
        productType: product[0].productType,
        productImg: product[0].productImg,
        description: description,
        created_at: today,
        last_modified: today,
      };
      //Tìm tới loại sản phẩm, tìm tới sản phẩm có index bằng cái index mình đã tìm, dùng $set để cập nhật lại
      await productType
        .updateOne({
          $set: { [`product.${productIndex}`]: newProduct },
        })
        .then(async () => {
          return res.json({
            success: true,
            mgs: "Cập nhật loại sản phẩm thành công",
          });
        });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      mgs: "Có sự cố xảy ra. Không thể cập nhật loại sản phẩm!",
    });
  }
};